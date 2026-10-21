// Security rules tests. Run with the Firestore emulator:
//   npm run test:rules
import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const OWNER = 'admin@vikaspublicschool.in';
let env;

const asOwner = () => env.authenticatedContext('owner', { email: OWNER }).firestore();
const asStaff = (email, verified = true) => env.authenticatedContext(email, { email, email_verified: verified }).firestore();
const asPublic = () => env.unauthenticatedContext().firestore();

const enquiry = (extra = {}) => ({
  type: 'admission', parentName: 'Ravi Kumar', phone: '9876543210', studentName: 'Asha',
  classApplying: 'Class 3', message: 'Please call', status: 'new', createdAt: serverTimestamp(), ...extra,
});
const activity = (by, extra = {}) => ({ by, byName: 'X', action: 'update', area: 'faculty', label: 'Saved', at: serverTimestamp(), ...extra });

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-vps-rules',
    firestore: { rules: readFileSync(resolve(import.meta.dirname, '../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8085 },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'staff', 'editor@example.com'), { name: 'Editor', role: 'editor', active: true });
    await setDoc(doc(db, 'staff', 'head@example.com'), { name: 'Head', role: 'admin', active: true });
    await setDoc(doc(db, 'staff', 'gone@example.com'), { name: 'Gone', role: 'admin', active: false });
    await setDoc(doc(db, 'settings', 'disclosure'), { sections: [] });
    await setDoc(doc(db, 'faculty', 'f1'), { name: 'Teacher' });
    await setDoc(doc(db, 'enquiries', 'e1'), { ...enquiry(), createdAt: new Date() });
  });
});

after(() => env.cleanup());

describe('public visitors', () => {
  test('can read website content', async () => {
    await assertSucceeds(getDocs(collection(asPublic(), 'faculty')));
    await assertSucceeds(getDoc(doc(asPublic(), 'settings', 'disclosure')));
    await assertSucceeds(getDocs(collection(asPublic(), 'calendar')));
    await assertSucceeds(getDocs(collection(asPublic(), 'downloads')));
  });
  test('cannot read private collections', async () => {
    await assertFails(getDocs(collection(asPublic(), 'enquiries')));
    await assertFails(getDocs(collection(asPublic(), 'staff')));
    await assertFails(getDocs(collection(asPublic(), 'activity')));
  });
  test('cannot write content', async () => {
    await assertFails(setDoc(doc(asPublic(), 'faculty', 'x'), { name: 'Hacker' }));
    await assertFails(setDoc(doc(asPublic(), 'settings', 'hero'), { title: 'x' }));
  });
  test('can send a valid enquiry', async () => {
    await assertSucceeds(addDoc(collection(asPublic(), 'enquiries'), enquiry()));
    await assertSucceeds(addDoc(collection(asPublic(), 'enquiries'), { type: 'general', parentName: 'A', email: 'a@b.co', status: 'new', createdAt: serverTimestamp() }));
  });
  test('cannot send an invalid enquiry', async () => {
    await assertFails(addDoc(collection(asPublic(), 'enquiries'), enquiry({ status: 'admitted' })));
    await assertFails(addDoc(collection(asPublic(), 'enquiries'), enquiry({ createdAt: new Date(2000, 1, 1) })));
    await assertFails(addDoc(collection(asPublic(), 'enquiries'), enquiry({ admin: true })));
    await assertFails(addDoc(collection(asPublic(), 'enquiries'), enquiry({ message: 'x'.repeat(2001) })));
    await assertFails(addDoc(collection(asPublic(), 'enquiries'), enquiry({ parentName: '' })));
    const { phone, ...noContact } = enquiry();
    await assertFails(addDoc(collection(asPublic(), 'enquiries'), noContact));
  });
  test('cannot change or delete enquiries', async () => {
    await assertFails(updateDoc(doc(asPublic(), 'enquiries', 'e1'), { status: 'closed' }));
    await assertFails(deleteDoc(doc(asPublic(), 'enquiries', 'e1')));
  });
});

describe('owner', () => {
  test('can edit everything, including the disclosure', async () => {
    const db = asOwner();
    await assertSucceeds(setDoc(doc(db, 'faculty', 'f2'), { name: 'New' }));
    await assertSucceeds(setDoc(doc(db, 'settings', 'disclosure'), { sections: [] }));
    await assertSucceeds(setDoc(doc(db, 'settings', 'site'), { seoTitle: 'x' }));
    await assertSucceeds(setDoc(doc(db, 'staff', 'new@example.com'), { name: 'New', role: 'editor', active: true }));
  });
  test('cannot add itself to the staff list', async () => {
    await assertFails(setDoc(doc(asOwner(), 'staff', OWNER), { name: 'Me', role: 'editor', active: true }));
  });
});

describe('editors', () => {
  test('can edit content and homepage text', async () => {
    const db = asStaff('editor@example.com');
    await assertSucceeds(setDoc(doc(db, 'calendar', 'c1'), { title: 'Sports day' }));
    await assertSucceeds(setDoc(doc(db, 'settings', 'announcement'), { enabled: true }));
    await assertSucceeds(setDoc(doc(db, 'cache', 'calendar'), { lastUpdated: 1 }));
  });
  test('cannot edit admin-only settings, staff or the disclosure', async () => {
    const db = asStaff('editor@example.com');
    await assertFails(setDoc(doc(db, 'settings', 'site'), { seoTitle: 'x' }));
    await assertFails(setDoc(doc(db, 'settings', 'contact'), { phone: '1' }));
    await assertFails(setDoc(doc(db, 'settings', 'disclosure'), { sections: [] }));
    await assertFails(setDoc(doc(db, 'staff', 'x@example.com'), { name: 'X', role: 'admin', active: true }));
    await assertFails(updateDoc(doc(db, 'staff', 'editor@example.com'), { role: 'admin' }));
  });
  test('can work enquiries but not rewrite what the visitor sent', async () => {
    const db = asStaff('editor@example.com');
    await assertSucceeds(getDocs(collection(db, 'enquiries')));
    await assertSucceeds(updateDoc(doc(db, 'enquiries', 'e1'), { status: 'contacted', notes: [{ text: 'Called' }] }));
    await assertFails(updateDoc(doc(db, 'enquiries', 'e1'), { parentName: 'Changed' }));
    await assertFails(updateDoc(doc(db, 'enquiries', 'e1'), { status: 'spam' }));
  });
  test('cannot read the activity log', async () => {
    await assertFails(getDocs(collection(asStaff('editor@example.com'), 'activity')));
  });
});

describe('staff admins', () => {
  test('can manage staff and site settings', async () => {
    const db = asStaff('head@example.com');
    await assertSucceeds(setDoc(doc(db, 'settings', 'site'), { seoTitle: 'x' }));
    await assertSucceeds(setDoc(doc(db, 'staff', 'x@example.com'), { name: 'X', role: 'editor', active: true }));
    await assertSucceeds(getDocs(collection(db, 'activity')));
  });
  test('cannot touch the owner entry or use uppercase ids', async () => {
    const db = asStaff('head@example.com');
    await assertFails(setDoc(doc(db, 'staff', OWNER), { name: 'X', role: 'editor', active: true }));
    await assertFails(setDoc(doc(db, 'staff', 'Upper@Example.com'), { name: 'X', role: 'editor', active: true }));
    await assertFails(setDoc(doc(db, 'staff', 'y@example.com'), { name: 'X', role: 'owner', active: true }));
  });
});

describe('unverified, inactive or unknown accounts', () => {
  test('cannot write anything', async () => {
    await assertFails(setDoc(doc(asStaff('editor@example.com', false), 'faculty', 'x'), { name: 'X' }));
    await assertFails(setDoc(doc(asStaff('gone@example.com'), 'faculty', 'x'), { name: 'X' }));
    await assertFails(setDoc(doc(asStaff('stranger@example.com'), 'faculty', 'x'), { name: 'X' }));
    await assertFails(getDocs(collection(asStaff('stranger@example.com'), 'enquiries')));
  });
  test('can read only their own staff entry', async () => {
    await assertSucceeds(getDoc(doc(asStaff('editor@example.com', false), 'staff', 'editor@example.com')));
    await assertFails(getDoc(doc(asStaff('editor@example.com', false), 'staff', 'head@example.com')));
  });
});

describe('activity log', () => {
  test('staff append entries in their own name only', async () => {
    const db = asStaff('editor@example.com');
    await assertSucceeds(addDoc(collection(db, 'activity'), activity('editor@example.com')));
    await assertFails(addDoc(collection(db, 'activity'), activity('head@example.com')));
    await assertFails(addDoc(collection(asPublic(), 'activity'), activity('editor@example.com')));
  });
  test('entries cannot be edited or deleted', async () => {
    let id;
    await env.withSecurityRulesDisabled(async ctx => { id = (await addDoc(collection(ctx.firestore(), 'activity'), { by: OWNER })).id; });
    await assertFails(updateDoc(doc(asOwner(), 'activity', id), { label: 'x' }));
    await assertFails(deleteDoc(doc(asOwner(), 'activity', id)));
  });
});
