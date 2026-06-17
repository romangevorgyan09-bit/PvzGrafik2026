/**
 * Helper utilities for generating and parsing guest recovery codes.
 * This maps a user-friendly code like PVZ-XXXXXX-YYYYYY to a Firebase Auth email and password.
 */

export interface GuestCredentials {
  code: string;
  email: string;
  mdPas: string;
}

export function generateRecoveryCode(): GuestCredentials {
  // Generate random 6-character user part
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude confusing chars like I, O, 0, 1
  let userPart = '';
  let passPart = '';
  
  for (let i = 0; i < 6; i++) {
    userPart += chars.charAt(Math.floor(Math.random() * chars.length));
    passPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const code = `PVZ-${userPart}-${passPart}`;
  const email = `guest_${userPart.toLowerCase()}@pvz-schedule.app`;
  const password = `pwd_${userPart.toLowerCase()}_${passPart.toLowerCase()}`;
  
  return { code, email, mdPas: password };
}

export function parseRecoveryCode(code: string): { email: string; mdPas: string } | null {
  const clean = code.trim().toUpperCase().replace(/\s+/g, '');
  const parts = clean.split('-');
  
  if (parts.length !== 3 || parts[0] !== 'PVZ') {
    return null;
  }
  
  const userPart = parts[1].toLowerCase();
  const passPart = parts[2].toLowerCase();
  
  if (userPart.length !== 6 || passPart.length !== 6) {
    return null;
  }
  
  return {
    email: `guest_${userPart}@pvz-schedule.app`,
    mdPas: `pwd_${userPart}_${passPart}`
  };
}
