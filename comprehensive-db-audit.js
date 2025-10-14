#!/usr/bin/env node

/**
 * Comprehensive Database Schema Audit
 * Compares local and production database schemas to identify differences
 * and provides recommendations for synchronization
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

console.log('🔍 Comprehensive Database Schema Audit');
console.log('=====================================');

// Configuration
const OUTPUT_DIR = './audit-results';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Extract detailed schema information from a database
 */
async function extractSchemaInfo(sql, environment) {
  console.log(`\n📊 Extracting schema from ${environment}...`);
  
  const schemaInfo = {
    environment,
    timestamp: new Date().toISOString(),
    tables: {},
    indexes: {},
    constraints: {},
    functions: {},
    triggers: {},
    sequences: {}
  };

  try {
    // Get all tables with detailed column information
    const tables = await sql`
      SELECT 
        t.table_name,
        t.table_type,
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.is_nullable,
        c.column_default,
        c.ordinal_position,
        c.udt_name
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name, c.ordinal_position
    `;

    // Group columns by table
    tables.forEach(row => {
      if (!schemaInfo.tables[row.table_name]) {
        schemaInfo.tables[row.table_name] = {
          table_name: row.table_name,
          table_type: row.table_type,
          columns: []
        };
      }
      
      if (row.column_name) {
        schemaInfo.tables[row.table_name].columns.push({
          column_name: row.column_name,
          data_type: row.data_type,
          character_maximum_length: row.character_maximum_length,
          is_nullable: row.is_nullable,
          column_default: row.column_default,
          ordinal_position: row.ordinal_position,
          udt_name: row.udt_name
        });
      }
    });

    // Get indexes
    const indexes = await sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    
    indexes.forEach(idx => {
      if (!schemaInfo.indexes[idx.tablename]) {
        schemaInfo.indexes[idx.tablename] = [];
      }
      schemaInfo.indexes[idx.tablename].push({
        indexname: idx.indexname,
        indexdef: idx.indexdef
      });
    });

    // Get constraints (foreign keys, primary keys, unique constraints)
    const constraints = await sql`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc 
      LEFT JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      LEFT JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `;
    
    constraints.forEach(constraint => {
      if (!schemaInfo.constraints[constraint.table_name]) {
        schemaInfo.constraints[constraint.table_name] = [];
      }
      schemaInfo.constraints[constraint.table_name].push({
        constraint_name: constraint.constraint_name,
        constraint_type: constraint.constraint_type,
        column_name: constraint.column_name,
        foreign_table_name: constraint.foreign_table_name,
        foreign_column_name: constraint.foreign_column_name,
        delete_rule: constraint.delete_rule,
        update_rule: constraint.update_rule
      });
    });

    // Get sequences
    const sequences = await sql`
      SELECT 
        sequence_name,
        data_type,
        start_value,
        minimum_value,
        maximum_value,
        increment,
        cycle_option
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `;
    
    sequences.forEach(seq => {
      schemaInfo.sequences[seq.sequence_name] = {
        data_type: seq.data_type,
        start_value: seq.start_value,
        minimum_value: seq.minimum_value,
        maximum_value: seq.maximum_value,
        increment: seq.increment,
        cycle_option: seq.cycle_option
      };
    });

    // Get functions
    const functions = await sql`
      SELECT 
        routine_name,
        routine_type,
        data_type,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `;
    
    functions.forEach(func => {
      schemaInfo.functions[func.routine_name] = {
        routine_type: func.routine_type,
        data_type: func.data_type,
        routine_definition: func.routine_definition
      };
    });

    // Get triggers
    const triggers = await sql`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `;
    
    triggers.forEach(trigger => {
      if (!schemaInfo.triggers[trigger.event_object_table]) {
        schemaInfo.triggers[trigger.event_object_table] = [];
      }
      schemaInfo.triggers[trigger.event_object_table].push({
        trigger_name: trigger.trigger_name,
        event_manipulation: trigger.event_manipulation,
        action_timing: trigger.action_timing,
        action_statement: trigger.action_statement
      });
    });

    console.log(`✅ Extracted schema from ${environment}:`);
    console.log(`   - Tables: ${Object.keys(schemaInfo.tables).length}`);
    console.log(`   - Indexes: ${Object.keys(schemaInfo.indexes).length} tables with indexes`);
    console.log(`   - Constraints: ${Object.keys(schemaInfo.constraints).length} tables with constraints`);
    console.log(`   - Sequences: ${Object.keys(schemaInfo.sequences).length}`);
    console.log(`   - Functions: ${Object.keys(schemaInfo.functions).length}`);
    console.log(`   - Triggers: ${Object.keys(schemaInfo.triggers).length} tables with triggers`);

    return schemaInfo;

  } catch (error) {
    console.error(`❌ Error extracting schema from ${environment}:`, error.message);
    throw error;
  }
}

/**
 * Compare two schema objects and identify differences
 */
function compareSchemas(localSchema, prodSchema) {
  console.log('\n🔍 Comparing schemas...');
  
  const differences = {
    tables: {
      missing_in_prod: [],
      missing_in_local: [],
      different_columns: {},
      different_constraints: {},
      different_indexes: {}
    },
    sequences: {
      missing_in_prod: [],
      missing_in_local: [],
      different: {}
    },
    functions: {
      missing_in_prod: [],
      missing_in_local: [],
      different: {}
    },
    triggers: {
      missing_in_prod: [],
      missing_in_local: [],
      different: {}
    }
  };

  // Compare tables
  const localTables = Object.keys(localSchema.tables);
  const prodTables = Object.keys(prodSchema.tables);
  
  // Tables missing in production
  differences.tables.missing_in_prod = localTables.filter(table => !prodTables.includes(table));
  
  // Tables missing in local
  differences.tables.missing_in_local = prodTables.filter(table => !localTables.includes(table));
  
  // Compare common tables
  const commonTables = localTables.filter(table => prodTables.includes(table));
  
  commonTables.forEach(tableName => {
    const localTable = localSchema.tables[tableName];
    const prodTable = prodSchema.tables[tableName];
    
    // Compare columns
    const localColumns = localTable.columns.map(col => col.column_name);
    const prodColumns = prodTable.columns.map(col => col.column_name);
    
    const missingColumnsInProd = localColumns.filter(col => !prodColumns.includes(col));
    const missingColumnsInLocal = prodColumns.filter(col => !localColumns.includes(col));
    
    if (missingColumnsInProd.length > 0 || missingColumnsInLocal.length > 0) {
      differences.tables.different_columns[tableName] = {
        missing_in_prod: missingColumnsInProd,
        missing_in_local: missingColumnsInLocal
      };
    }
    
    // Compare column definitions for common columns
    const commonColumns = localColumns.filter(col => prodColumns.includes(col));
    const columnDifferences = [];
    
    commonColumns.forEach(columnName => {
      const localCol = localTable.columns.find(col => col.column_name === columnName);
      const prodCol = prodTable.columns.find(col => col.column_name === columnName);
      
      if (localCol && prodCol) {
        const colDiff = {};
        let hasDiff = false;
        
        if (localCol.data_type !== prodCol.data_type) {
          colDiff.data_type = { local: localCol.data_type, prod: prodCol.data_type };
          hasDiff = true;
        }
        if (localCol.is_nullable !== prodCol.is_nullable) {
          colDiff.is_nullable = { local: localCol.is_nullable, prod: prodCol.is_nullable };
          hasDiff = true;
        }
        if (localCol.column_default !== prodCol.column_default) {
          colDiff.column_default = { local: localCol.column_default, prod: prodCol.column_default };
          hasDiff = true;
        }
        
        if (hasDiff) {
          columnDifferences.push({ column: columnName, differences: colDiff });
        }
      }
    });
    
    if (columnDifferences.length > 0) {
      differences.tables.different_columns[tableName] = {
        ...differences.tables.different_columns[tableName],
        column_definitions: columnDifferences
      };
    }
  });

  // Compare sequences
  const localSequences = Object.keys(localSchema.sequences);
  const prodSequences = Object.keys(prodSchema.sequences);
  
  differences.sequences.missing_in_prod = localSequences.filter(seq => !prodSequences.includes(seq));
  differences.sequences.missing_in_local = prodSequences.filter(seq => !localSequences.includes(seq));

  // Compare functions
  const localFunctions = Object.keys(localSchema.functions);
  const prodFunctions = Object.keys(prodSchema.functions);
  
  differences.functions.missing_in_prod = localFunctions.filter(func => !prodFunctions.includes(func));
  differences.functions.missing_in_local = prodFunctions.filter(func => !localFunctions.includes(func));

  return differences;
}

/**
 * Generate detailed report
 */
function generateReport(localSchema, prodSchema, differences) {
  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      local_tables: Object.keys(localSchema.tables).length,
      prod_tables: Object.keys(prodSchema.tables).length,
      critical_differences: 0,
      warnings: 0
    },
    differences,
    recommendations: []
  };

  // Count critical differences
  if (differences.tables.missing_in_prod.length > 0) {
    report.summary.critical_differences += differences.tables.missing_in_prod.length;
    report.recommendations.push({
      type: 'CRITICAL',
      message: `Tables missing in production: ${differences.tables.missing_in_prod.join(', ')}`,
      action: 'Run database migrations to create missing tables'
    });
  }

  if (differences.tables.missing_in_local.length > 0) {
    report.summary.warnings += differences.tables.missing_in_local.length;
    report.recommendations.push({
      type: 'WARNING',
      message: `Tables in production not in local: ${differences.tables.missing_in_local.join(', ')}`,
      action: 'Update local schema or remove unused tables from production'
    });
  }

  // Check for column differences
  const tablesWithColumnDiffs = Object.keys(differences.tables.different_columns);
  if (tablesWithColumnDiffs.length > 0) {
    report.summary.critical_differences += tablesWithColumnDiffs.length;
    report.recommendations.push({
      type: 'CRITICAL',
      message: `Tables with column differences: ${tablesWithColumnDiffs.join(', ')}`,
      action: 'Review and sync column definitions between environments'
    });
  }

  return report;
}

/**
 * Generate deployment workflow script
 */
function generateDeploymentWorkflow(report) {
  const workflowScript = `#!/bin/bash

# Database Deployment Workflow
# Generated on ${new Date().toISOString()}

echo "🚀 Starting database deployment workflow..."

# Step 1: Backup production database
echo "📦 Creating production backup..."
node backup-production.js

# Step 2: Generate migration from local schema
echo "📝 Generating migration from local schema..."
npx drizzle-kit generate

# Step 3: Apply migration to production
echo "🔄 Applying migration to production..."
npx drizzle-kit push --force

# Step 4: Verify schema synchronization
echo "✅ Verifying schema synchronization..."
node comprehensive-db-audit.js

echo "🎉 Database deployment completed!"
`;

  return workflowScript;
}

/**
 * Main audit function
 */
async function runAudit() {
  try {
    console.log('🚀 Starting database schema audit...\n');

    // Database URLs
    const localDbUrl = "postgresql://neondb_owner:npg_8hQj7xVaUtiZ@ep-blue-silence-afokhoq0-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
    const prodDbUrl = "postgres://neondb_owner:npg_DTnBFMrw5Za0@ep-jolly-art-af9o1fww-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

    console.log('🔗 Connecting to databases...');
    console.log(`   Local: ${localDbUrl.substring(0, 50)}...`);
    console.log(`   Production: ${prodDbUrl.substring(0, 50)}...`);

    // Extract local schema
    const localSql = neon(localDbUrl);
    const localSchema = await extractSchemaInfo(localSql, 'localhost');

    // Extract production schema
    const prodSql = neon(prodDbUrl);
    const prodSchema = await extractSchemaInfo(prodSql, 'production');

    // Save schemas
    const localSchemaFile = path.join(OUTPUT_DIR, `local-schema-${TIMESTAMP}.json`);
    const prodSchemaFile = path.join(OUTPUT_DIR, `prod-schema-${TIMESTAMP}.json`);
    
    fs.writeFileSync(localSchemaFile, JSON.stringify(localSchema, null, 2));
    fs.writeFileSync(prodSchemaFile, JSON.stringify(prodSchema, null, 2));
    
    console.log(`💾 Local schema saved to: ${localSchemaFile}`);
    console.log(`💾 Production schema saved to: ${prodSchemaFile}`);

    // Compare schemas
    const differences = compareSchemas(localSchema, prodSchema);
    
    // Generate report
    const report = generateReport(localSchema, prodSchema, differences);

    // Save comparison report
    const reportFile = path.join(OUTPUT_DIR, `schema-comparison-${TIMESTAMP}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📊 Comparison report saved to: ${reportFile}`);

    // Generate deployment workflow
    const workflowScript = generateDeploymentWorkflow(report);
    const workflowFile = path.join(OUTPUT_DIR, `deployment-workflow-${TIMESTAMP}.sh`);
    fs.writeFileSync(workflowFile, workflowScript);
    fs.chmodSync(workflowFile, '755');
    console.log(`🚀 Deployment workflow saved to: ${workflowFile}`);

    // Print summary
    console.log('\n📋 AUDIT SUMMARY');
    console.log('================');
    console.log(`Local tables: ${report.summary.local_tables}`);
    console.log(`Production tables: ${report.summary.prod_tables}`);
    console.log(`Critical differences: ${report.summary.critical_differences}`);
    console.log(`Warnings: ${report.summary.warnings}`);

    if (report.summary.critical_differences > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      report.recommendations
        .filter(rec => rec.type === 'CRITICAL')
        .forEach(rec => console.log(`  - ${rec.message}`));
    }

    if (report.summary.warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.recommendations
        .filter(rec => rec.type === 'WARNING')
        .forEach(rec => console.log(`  - ${rec.message}`));
    }

    if (report.summary.critical_differences === 0 && report.summary.warnings === 0) {
      console.log('\n✅ No schema differences found!');
      console.log('Local and production schemas are in sync.');
    }

    console.log('\n🎉 Database audit completed successfully!');
    console.log(`📁 Results saved in: ${OUTPUT_DIR}`);
    console.log(`🚀 Run deployment workflow: bash ${workflowFile}`);

  } catch (error) {
    console.error('\n💥 Database audit failed:', error);
    process.exit(1);
  }
}

// Run the audit
runAudit();
