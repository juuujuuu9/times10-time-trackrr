#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates a comprehensive backup of the production database before migration
 */

import { db } from './src/db/index.ts';
import { 
  users, 
  projects, 
  clients, 
  timeEntries, 
  tasks,
  userTaskLists,
  teams,
  teamMembers,
  taskCollaborations,
  taskDiscussions,
  taskFiles,
  taskLinks,
  taskNotes,
  notifications
} from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = './backups';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];

async function createBackup() {
  console.log('🔄 Creating comprehensive database backup...');
  console.log(`📅 Backup timestamp: ${TIMESTAMP}`);
  
  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    tables: {}
  };

  try {
    console.log('📊 Backing up core tables...');
    
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

    // Check if collaborative tables exist and backup them
    console.log('🔍 Checking for existing collaborative tables...');
    
    try {
      const teamsData = await db.select().from(teams);
      backupData.tables.teams = teamsData;
      console.log(`✅ Teams: ${teamsData.length} records`);
    } catch (error) {
      console.log('⚠️  Teams table does not exist yet');
      backupData.tables.teams = [];
    }

    try {
      const teamMembersData = await db.select().from(teamMembers);
      backupData.tables.teamMembers = teamMembersData;
      console.log(`✅ Team Members: ${teamMembersData.length} records`);
    } catch (error) {
      console.log('⚠️  Team Members table does not exist yet');
      backupData.tables.teamMembers = [];
    }

    // Save backup to file
    const backupFileName = `database_backup_${TIMESTAMP}.json`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    console.log(`💾 Backup saved to: ${backupFilePath}`);
    console.log(`📊 Total size: ${(fs.statSync(backupFilePath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Create a summary file
    const summary = {
      timestamp: backupData.timestamp,
      totalRecords: Object.values(backupData.tables).reduce((sum, table) => sum + table.length, 0),
      tables: Object.keys(backupData.tables).map(table => ({
        name: table,
        records: backupData.tables[table].length
      }))
    };
    
    const summaryFileName = `backup_summary_${TIMESTAMP}.json`;
    const summaryFilePath = path.join(BACKUP_DIR, summaryFileName);
    fs.writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2));
    
    console.log('📋 Backup Summary:');
    console.log(`   Total Records: ${summary.totalRecords}`);
    summary.tables.forEach(table => {
      console.log(`   ${table.name}: ${table.records} records`);
    });
    
    console.log('✅ Database backup completed successfully!');
    console.log(`📁 Backup files: ${backupFilePath}, ${summaryFilePath}`);
    
    return {
      success: true,
      backupFile: backupFilePath,
      summaryFile: summaryFilePath,
      recordCount: summary.totalRecords
    };

  } catch (error) {
    console.error('❌ Backup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup()
    .then(result => {
      if (result.success) {
        console.log('🎉 Backup completed successfully!');
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
}

export { createBackup };
