import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users, clients, projects, timeEntries } from '../../../db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Authentication required',
        error: 'Not authenticated'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get query parameters
    const searchParams = url.searchParams;
    const period = searchParams.get('period') || 'week';
    const teamMember = searchParams.get('teamMember') || 'all';
    const project = searchParams.get('project');
    const client = searchParams.get('client');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range based on period
    const now = new Date();
    let filterStartDate: Date | null = null;
    let filterEndDate: Date | null = null;

    switch (period) {
      case 'all':
        filterStartDate = null;
        filterEndDate = null;
        break;
      case 'today':
        filterStartDate = new Date(now);
        filterStartDate.setHours(0, 0, 0, 0);
        filterEndDate = new Date(now);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
        filterStartDate = new Date(now);
        filterStartDate.setDate(now.getDate() - daysToSubtract);
        filterStartDate.setHours(0, 0, 0, 0);
        filterEndDate = new Date(filterStartDate);
        filterEndDate.setDate(filterStartDate.getDate() + 6);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = currentQuarter * 3;
        filterStartDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        filterEndDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
        break;
      case 'custom':
        if (startDate && endDate) {
          filterStartDate = new Date(startDate);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date(endDate);
          filterEndDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    // Build filter conditions
    let filterConditions = [
      eq(clients.archived, false),
      eq(projects.archived, false)
    ];

    // Add date filter
    if (filterStartDate && filterEndDate) {
      filterConditions.push(sql`(
        (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${filterStartDate} AND ${timeEntries.startTime} <= ${filterEndDate})
        OR 
        (${timeEntries.startTime} IS NULL AND ${timeEntries.createdAt} >= ${filterStartDate} AND ${timeEntries.createdAt} <= ${filterEndDate})
      )`);
    }

    // Add team member filter
    if (teamMember !== 'all') {
      filterConditions.push(eq(timeEntries.userId, parseInt(teamMember)));
    }

    // Add project filter
    if (project) {
      filterConditions.push(eq(projects.id, parseInt(project)));
    }

    // Add client filter
    if (client) {
      filterConditions.push(eq(clients.id, parseInt(client)));
    }

    const dateFilter = and(...filterConditions);

    // Get time entries with all details
    const timeEntriesWithDetails = await db
      .select({
        id: timeEntries.id,
        userId: timeEntries.userId,
        projectId: timeEntries.projectId,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPayRate: users.payRate,
        projectName: projects.name,
        clientName: clients.name
      })
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        dateFilter,
        // Exclude ongoing timers
        sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
      ))
      .orderBy(timeEntries.createdAt);

    // Calculate summary metrics
    const totalHours = timeEntriesWithDetails.reduce((sum, entry) => {
      if (entry.durationManual) {
        return sum + (entry.durationManual / 3600);
      } else if (entry.startTime && entry.endTime) {
        return sum + ((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60));
      }
      return sum;
    }, 0);

    const totalCost = timeEntriesWithDetails.reduce((sum, entry) => {
      if (entry.userPayRate) {
        const payRate = parseFloat(entry.userPayRate);
        if (entry.durationManual) {
          return sum + (entry.durationManual / 3600 * payRate);
        } else if (entry.startTime && entry.endTime) {
          const hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
          return sum + (hours * payRate);
        }
      }
      return sum;
    }, 0);

    const manualEntries = timeEntriesWithDetails.filter(e => e.durationManual).length;
    const timerEntries = timeEntriesWithDetails.filter(e => e.startTime && e.endTime).length;

    // Calculate user metrics
    const userMetrics = timeEntriesWithDetails.reduce((acc, entry) => {
      if (!acc[entry.userId]) {
        acc[entry.userId] = {
          id: entry.userId,
          name: entry.userName,
          email: entry.userEmail,
          payRate: entry.userPayRate,
          entries: 0,
          hours: 0,
          cost: 0,
          manualEntries: 0,
          timerEntries: 0
        };
      }

      const stats = acc[entry.userId];
      stats.entries++;

      let hours = 0;
      if (entry.durationManual) {
        hours = entry.durationManual / 3600;
        stats.manualEntries++;
      } else if (entry.startTime && entry.endTime) {
        hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
        stats.timerEntries++;
      }

      stats.hours += hours;

      if (entry.userPayRate) {
        const payRate = parseFloat(entry.userPayRate);
        stats.cost += hours * payRate;
      }

      return acc;
    }, {} as Record<number, any>);

    // Calculate project metrics
    const projectMetrics = timeEntriesWithDetails.reduce((acc, entry) => {
      if (!acc[entry.projectId]) {
        acc[entry.projectId] = {
          id: entry.projectId,
          name: entry.projectName,
          client: entry.clientName,
          entries: 0,
          hours: 0,
          cost: 0
        };
      }

      const stats = acc[entry.projectId];
      stats.entries++;

      let hours = 0;
      if (entry.durationManual) {
        hours = entry.durationManual / 3600;
      } else if (entry.startTime && entry.endTime) {
        hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
      }

      stats.hours += hours;

      if (entry.userPayRate) {
        const payRate = parseFloat(entry.userPayRate);
        stats.cost += hours * payRate;
      }

      return acc;
    }, {} as Record<number, any>);

    // Calculate client metrics
    const clientMetrics = timeEntriesWithDetails.reduce((acc, entry) => {
      if (!acc[entry.clientName]) {
        acc[entry.clientName] = {
          name: entry.clientName,
          entries: 0,
          hours: 0,
          cost: 0,
          projects: new Set()
        };
      }

      const stats = acc[entry.clientName];
      stats.entries++;
      stats.projects.add(entry.projectName);

      let hours = 0;
      if (entry.durationManual) {
        hours = entry.durationManual / 3600;
      } else if (entry.startTime && entry.endTime) {
        hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
      }

      stats.hours += hours;

      if (entry.userPayRate) {
        const payRate = parseFloat(entry.userPayRate);
        stats.cost += hours * payRate;
      }

      return acc;
    }, {} as Record<string, any>);

    // Convert client metrics to array format
    const clientMetricsArray = Object.entries(clientMetrics).map(([name, data]: [string, any]) => ({
      name,
      ...data,
      projectCount: data.projects.size
    }));

    return new Response(JSON.stringify({
      success: true,
      message: 'Enhanced dashboard data retrieved successfully',
      data: {
        summary: {
          totalHours: Math.round(totalHours),
          totalCost: Math.round(totalCost),
          totalEntries: timeEntriesWithDetails.length,
          manualEntries,
          timerEntries,
          manualPercentage: Math.round(manualEntries / timeEntriesWithDetails.length * 100),
          timerPercentage: Math.round(timerEntries / timeEntriesWithDetails.length * 100)
        },
        timeEntries: timeEntriesWithDetails,
        userMetrics: Object.values(userMetrics),
        projectMetrics: Object.values(projectMetrics),
        clientMetrics: clientMetricsArray,
        period,
        filters: {
          teamMember,
          project,
          client,
          startDate: filterStartDate?.toISOString(),
          endDate: filterEndDate?.toISOString()
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching enhanced dashboard data:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch enhanced dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
