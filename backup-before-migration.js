#!/usr/bin/env node

/**
 * Database Backup Script - Before Collaborative Features Migration
 * Creates a comprehensive backup of all existing data
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];

console.log('🔄 Creating comprehensive database backup...');
console.log(`📅 Backup timestamp: ${TIMESTAMP}`);

async function createBackup() {
  try {
    // Get database URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {}
    };

    console.log('\n📊 Backing up existing data...');
    
    // Backup users
    const users = await sql`SELECT * FROM users ORDER BY id`;
    backupData.tables.users = users;
    console.log(`✅ Users: ${users.length} records`);

    // Backup clients
    const clients = await sql`SELECT * FROM clients ORDER BY id`;
    backupData.tables.clients = clients;
    console.log(`✅ Clients: ${clients.length} records`);

    // Backup projects
    const projects = await sql`SELECT * FROM projects ORDER BY id`;
    backupData.tables.projects = projects;
    console.log(`✅ Projects: ${projects.length} records`);

    // Backup tasks
    const tasks = await sql`SELECT * FROM tasks ORDER BY id`;
    backupData.tables.tasks = tasks;
    console.log(`✅ Tasks: ${tasks.length} records`);

    // Backup time entries
    const timeEntries = await sql`SELECT * FROM time_entries ORDER BY id`;
    backupData.tables.timeEntries = timeEntries;
    console.log(`✅ Time Entries: ${timeEntries.length} records`);

    // Backup user task lists
    const userTaskLists = await sql`SELECT * FROM user_task_lists ORDER BY id`;
    backupData.tables.userTaskLists = userTaskLists;
    console.log(`✅ User Task Lists: ${userTaskLists.length} records`);

    // Check if collaborative tables exist and backup them
    console.log('\n🔍 Checking for existing collaborative tables...');
    
    try {
      const teams = await sql`SELECT * FROM teams ORDER BY id`;
      backupData.tables.teams = teams;
      console.log(`✅ Teams: ${teams.length} records`);
    } catch (error) {
      console.log('⚠️  Teams table does not exist yet');
      backupData.tables.teams = [];
    }

    try {
      const teamMembers = await sql`SELECT * FROM team_members ORDER BY team_id, user_id`;
      backupData.tables.teamMembers = teamMembers;
      console.log(`✅ Team Members: ${teamMembers.length} records`);
    } catch (error) {
      console.log('⚠️  Team Members table does not exist yet');
      backupData.tables.teamMembers = [];
    }

    try {
      const taskCollaborations = await sql`SELECT * FROM task_collaborations ORDER BY id`;
      backupData.tables.taskCollaborations = taskCollaborations;
      console.log(`✅ Task Collaborations: ${taskCollaborations.length} records`);
    } catch (error) {
      console.log('⚠️  Task Collaborations table does not exist yet');
      backupData.tables.taskCollaborations = [];
    }

    try {
      const taskDiscussions = await sql`SELECT * FROM task_discussions ORDER BY id`;
      backupData.tables.taskDiscussions = taskDiscussions;
      console.log(`✅ Task Discussions: ${taskDiscussions.length} records`);
    } catch (error) {
      console.log('⚠️  Task Discussions table does not exist yet');
      backupData.tables.taskDiscussions = [];
    }

    try {
      const taskFiles = await sql`SELECT * FROM task_files ORDER BY id`;
      backupData.tables.taskFiles = taskFiles;
      console.log(`✅ Task Files: ${taskFiles.length} records`);
    } catch (error) {
      console.log('⚠️  Task Files table does not exist yet');
      backupData.tables.taskFiles = [];
    }

    try {
      const taskLinks = await sql`SELECT * FROM task_links ORDER BY id`;
      backupData.tables.taskLinks = taskLinks;
      console.log(`✅ Task Links: ${taskLinks.length} records`);
    } catch (error) {
      console.log('⚠️  Task Links table does not exist yet');
      backupData.tables.taskLinks = [];
    }

    try {
      const taskNotes = await sql`SELECT * FROM task_notes ORDER BY id`;
      backupData.tables.taskNotes = taskNotes;
      console.log(`✅ Task Notes: ${taskNotes.length} records`);
    } catch (error) {
      console.log('⚠️  Task Notes table does not exist yet');
      backupData.tables.taskNotes = [];
    }

    try {
      const notifications = await sql`SELECT * FROM notifications ORDER BY id`;
      backupData.tables.notifications = notifications;
      console.log(`✅ Notifications: ${notifications.length} records`);
    } catch (error) {
      console.log('⚠️  Notifications table does not exist yet');
      backupData.tables.notifications = [];
    }

    // Save backup to file
    const backupFileName = `database_backup_${TIMESTAMP}.json`;
    const backupFilePath = path.join('.', backupFileName);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    console.log(`\n💾 Backup saved to: ${backupFilePath}`);
    console.log(`📊 Total size: ${(fs.statSync(backupFilePath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Create summary
    const totalRecords = Object.values(backupData.tables).reduce((sum, table) => sum + table.length, 0);
    
    console.log('\n📋 Backup Summary:');
    console.log(`   Total Records: ${totalRecords}`);
    Object.keys(backupData.tables).forEach(table => {
      console.log(`   ${table}: ${backupData.tables[table].length} records`);
    });
    
    console.log('\n✅ Database backup completed successfully!');
    console.log(`📁 Backup file: ${backupFilePath}`);
    console.log('🛡️  Your data is now safely backed up before migration.');
    
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
      console.log('\n🎉 Backup completed successfully!');
      console.log('🛡️  Your data is now safely backed up before migration.');
      process.exit(0);
    } else {
      console.error('\n💥 Backup failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Backup script error:', error);
    process.exit(1);
  });
