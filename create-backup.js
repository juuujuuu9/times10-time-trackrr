#!/usr/bin/env node

/**
 * Simple Database Backup Script
 * Creates a backup of existing data before migration
 */

import { db } from './src/db/index.ts';
import { 
  users, 
  projects, 
  clients, 
  timeEntries, 
  tasks,
  userTaskLists
} from './src/db/schema.ts';
import fs from 'fs';
import path from 'path';

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];

async function createBackup() {
  console.log('🔄 Creating database backup...');
  console.log(`📅 Backup timestamp: ${TIMESTAMP}`);
  
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    tables: {}
  };

  try {
    console.log('📊 Backing up existing data...');
    
    // Backup users
    const usersData = await db.select().from(users);
    backupData.tables.users = usersData;
    console.log(`✅ Users: ${usersData.length} records`);

    // Backup clients
    const clientsData = await db.select().from(clients);
    backupData.tables.clients = clientsData;
    console.log(`✅ Clients: ${clientsData.length} records`);

    // Backup projects
    const projectsData = await db.select().from(projects);
    backupData.tables.projects = projectsData;
    console.log(`✅ Projects: ${projectsData.length} records`);

    // Backup tasks
    const tasksData = await db.select().from(tasks);
    backupData.tables.tasks = tasksData;
    console.log(`✅ Tasks: ${tasksData.length} records`);

    // Backup time entries
    const timeEntriesData = await db.select().from(timeEntries);
    backupData.tables.timeEntries = timeEntriesData;
    console.log(`✅ Time Entries: ${timeEntriesData.length} records`);

    // Backup user task lists
    const userTaskListsData = await db.select().from(userTaskLists);
    backupData.tables.userTaskLists = userTaskListsData;
    console.log(`✅ User Task Lists: ${userTaskListsData.length} records`);

    // Save backup to file
    const backupFileName = `database_backup_${TIMESTAMP}.json`;
    const backupFilePath = path.join('.', backupFileName);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    console.log(`💾 Backup saved to: ${backupFilePath}`);
    console.log(`📊 Total size: ${(fs.statSync(backupFilePath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Create summary
    const totalRecords = Object.values(backupData.tables).reduce((sum, table) => sum + table.length, 0);
    
    console.log('📋 Backup Summary:');
    console.log(`   Total Records: ${totalRecords}`);
    Object.keys(backupData.tables).forEach(table => {
      console.log(`   ${table}: ${backupData.tables[table].length} records`);
    });
    
    console.log('✅ Database backup completed successfully!');
    console.log(`📁 Backup file: ${backupFilePath}`);
    
    return {
      success: true,
      backupFile: backupFilePath,
      recordCount: totalRecords
    };

  } catch (error) {
    console.error('❌ Backup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run backup
createBackup()
  .then(result => {
    if (result.success) {
      console.log('🎉 Backup completed successfully!');
      console.log('🛡️  Your data is now safely backed up before migration.');
      process.exit(0);
    } else {
      console.error('💥 Backup failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Backup script error:', error);
    process.exit(1);
  });
