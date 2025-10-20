/**
 * Utility functions for handling @ mentions in task stream content
 */

export interface MentionInfo {
  handle: string;
  fullName: string;
  userId: number;
  email: string;
}

/**
 * Extract @ mentions from content text
 * @param content The content to search for mentions
 * @returns Array of mention handles found in the content
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@([A-Za-z0-9_]+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(content)) !== null) {
    const handle = match[1];
    if (!mentions.includes(handle)) {
      mentions.push(handle);
    }
  }

  return mentions;
}

/**
 * Convert mention handles to user information
 * @param mentions Array of mention handles
 * @param teamMembers Array of team members to match against
 * @returns Array of user information for mentioned users
 */
export function resolveMentions(mentions: string[], teamMembers: any[]): MentionInfo[] {
  const resolvedMentions: MentionInfo[] = [];

  for (const handle of mentions) {
    // Try to find user by various name formats
    const user = teamMembers.find(member => {
      const fullName = member.name.toLowerCase();
      const email = member.email.toLowerCase();
      const handleLower = handle.toLowerCase();
      
      // Check if handle matches first name + last initial (e.g., "JohnD" matches "John Doe")
      const nameParts = fullName.split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        const expectedHandle = `${firstName}${lastName.charAt(0)}`.toLowerCase();
        if (expectedHandle === handleLower) {
          return true;
        }
      }
      
      // Check if handle matches full name (spaces removed)
      const fullNameNoSpaces = fullName.replace(/\s+/g, '');
      if (fullNameNoSpaces === handleLower) {
        return true;
      }
      
      // Check if handle matches email username
      const emailUsername = email.split('@')[0];
      if (emailUsername === handleLower) {
        return true;
      }
      
      // Check if handle matches full name
      if (fullName === handleLower) {
        return true;
      }
      
      return false;
    });

    if (user) {
      resolvedMentions.push({
        handle,
        fullName: user.name,
        userId: user.id,
        email: user.email
      });
    }
  }

  return resolvedMentions;
}

/**
 * Get the mention handle for a user (used for creating mentions)
 * @param user The user object
 * @returns The mention handle for the user
 */
export function getUserMentionHandle(user: any): string {
  const nameParts = user.name.split(' ');
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    return `${firstName}${lastName.charAt(0)}`;
  }
  return user.name.replace(/\s+/g, '');
}
