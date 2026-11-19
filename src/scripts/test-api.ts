/**
 * End-to-end API Verification Test Suite
 * Tests all 6 required APIs plus edge cases and validation rules.
 */

const BASE_URL = 'http://localhost:5000';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE BACKEND API TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, details || '');
      failed++;
    }
  }

  // 1. Health check
  const healthRes = await request('/health');
  assert(healthRes.status === 200 && healthRes.data.status === 'OK', 'Health Check Endpoint GET /health');

  // 2. API 1 - Create User
  const timestamp = Date.now();
  const testEmail = `student_${timestamp}@example.com`;
  const createUserRes = await request('/users', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Saurabh Agnihotri',
      email: testEmail,
      phone: '+919876500001',
    }),
  });
  assert(
    createUserRes.status === 201 && createUserRes.data?.data?.email === testEmail,
    'API 1: POST /users creates user with unique email',
    createUserRes
  );
  const createdUserId = createUserRes.data?.data?._id;

  // Duplicate email check
  const duplicateUserRes = await request('/users', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Duplicate User',
      email: testEmail,
      phone: '+919876500002',
    }),
  });
  assert(
    duplicateUserRes.status === 409,
    'API 1: Duplicate email yields 409 Conflict',
    duplicateUserRes
  );

  // 3. Create Teacher helper
  const teacherEmail = `prof_${timestamp}@example.com`;
  const createTeacherRes = await request('/teachers', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Abhishek Singh',
      email: teacherEmail,
      specialization: 'Full Stack Web Development & Node.js',
      experience: 8,
    }),
  });
  assert(
    createTeacherRes.status === 201 && createTeacherRes.data?.data?.email === teacherEmail,
    'POST /teachers creates a teacher',
    createTeacherRes
  );
  const createdTeacherId = createTeacherRes.data?.data?._id;

  // 4. API 2 - Create Session
  const now = new Date();
  const sessionStartTime = new Date(Date.now() + 86400000); // Tomorrow
  sessionStartTime.setMinutes(0, 0, 0);
  const sessionEndTime = new Date(sessionStartTime.getTime() + 3600000); // 1 hour later

  // Negative validation: endTime < startTime
  const invalidTimeSessionRes = await request('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      teacherId: createdTeacherId,
      startTime: sessionEndTime.toISOString(),
      endTime: sessionStartTime.toISOString(),
    }),
  });
  assert(
    invalidTimeSessionRes.status === 400,
    'API 2: endTime <= startTime rejected with 400 Bad Request',
    invalidTimeSessionRes
  );

  // Negative validation: teacher does not exist
  const fakeTeacherId = '507f1f77bcf86cd799439011';
  const invalidTeacherSessionRes = await request('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      teacherId: fakeTeacherId,
      startTime: sessionStartTime.toISOString(),
      endTime: sessionEndTime.toISOString(),
    }),
  });
  assert(
    invalidTeacherSessionRes.status === 404,
    'API 2: Non-existent teacherId returns 404 Not Found',
    invalidTeacherSessionRes
  );

  // Valid session creation
  const createSessionRes = await request('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      teacherId: createdTeacherId,
      startTime: sessionStartTime.toISOString(),
      endTime: sessionEndTime.toISOString(),
    }),
  });
  assert(
    createSessionRes.status === 201 && createSessionRes.data?.data?.status === 'AVAILABLE',
    'API 2: POST /sessions successfully creates AVAILABLE session',
    createSessionRes
  );
  const createdSessionId = createSessionRes.data?.data?._id;

  // 5. API 3 - Available Sessions for Booking (Aggregation Pipeline)
  const tomorrowTimestamp = sessionStartTime.getTime();
  const getAvailableRes = await request(`/sessions/available?dateTimestamp=${tomorrowTimestamp}`);
  assert(
    getAvailableRes.status === 200 &&
      Array.isArray(getAvailableRes.data?.data?.sessions) &&
      getAvailableRes.data?.data?.sessions.some((s: any) => s._id === createdSessionId),
    'API 3: GET /sessions/available returns sessions matching date with teacher details via Aggregation Pipeline',
    getAvailableRes
  );
  const sampleAvailable = getAvailableRes.data?.data?.sessions.find((s: any) => s._id === createdSessionId);
  assert(
    sampleAvailable?.teacher?.fullName === 'Abhishek Singh',
    'API 3: Aggregation $lookup correctly populates teacher details',
    sampleAvailable
  );

  // 6. API 4 - Book Session
  // Booking with non-existent user
  const fakeUserBookingRes = await request(`/sessions/${createdSessionId}/book`, {
    method: 'POST',
    body: JSON.stringify({ userId: '507f1f77bcf86cd799439011' }),
  });
  assert(
    fakeUserBookingRes.status === 404,
    'API 4: Booking with non-existent userId yields 404 Not Found',
    fakeUserBookingRes
  );

  // Valid booking
  const bookSessionRes = await request(`/sessions/${createdSessionId}/book`, {
    method: 'POST',
    body: JSON.stringify({ userId: createdUserId }),
  });
  assert(
    bookSessionRes.status === 200 && bookSessionRes.data?.data?.status === 'BOOKED',
    'API 4: POST /sessions/:id/book transitions session to BOOKED and associates userId',
    bookSessionRes
  );

  // Booking already booked session
  const doubleBookRes = await request(`/sessions/${createdSessionId}/book`, {
    method: 'POST',
    body: JSON.stringify({ userId: createdUserId }),
  });
  assert(
    doubleBookRes.status === 400,
    'API 4: Attempting to re-book an already BOOKED session yields 400 Bad Request',
    doubleBookRes
  );

  // 7. API 5 - Mark Session Complete
  // Unbooked session cannot be completed test
  // First create another available session
  const anotherStart = new Date(Date.now() + 172800000); // 2 days later
  const anotherEnd = new Date(anotherStart.getTime() + 3600000);
  const anotherSessionRes = await request('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      teacherId: createdTeacherId,
      startTime: anotherStart.toISOString(),
      endTime: anotherEnd.toISOString(),
    }),
  });
  const anotherSessionId = anotherSessionRes.data?.data?._id;

  const completeUnbookedRes = await request(`/sessions/${anotherSessionId}/complete`, {
    method: 'PATCH',
  });
  assert(
    completeUnbookedRes.status === 400,
    'API 5: Marking an AVAILABLE session as COMPLETED yields 400 Bad Request',
    completeUnbookedRes
  );

  // Valid completion of BOOKED session
  const completeRes = await request(`/sessions/${createdSessionId}/complete`, {
    method: 'PATCH',
  });
  assert(
    completeRes.status === 200 &&
      completeRes.data?.data?.status === 'COMPLETED' &&
      !!completeRes.data?.data?.completedAt,
    'API 5: PATCH /sessions/:id/complete marks session COMPLETED and sets completedAt timestamp',
    completeRes
  );

  // Re-completing completed session
  const reCompleteRes = await request(`/sessions/${createdSessionId}/complete`, {
    method: 'PATCH',
  });
  assert(
    reCompleteRes.status === 400,
    'API 5: Marking an already COMPLETED session as complete yields 400 Bad Request',
    reCompleteRes
  );

  // 8. API 6 - User Session List (Aggregation Pipeline)
  // Let's create one more session and book it for this user so they have both 1 Upcoming and 1 Completed!
  const thirdStart = new Date(Date.now() + 259200000); // 3 days later
  const thirdEnd = new Date(thirdStart.getTime() + 3600000);
  const thirdSessionRes = await request('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      teacherId: createdTeacherId,
      startTime: thirdStart.toISOString(),
      endTime: thirdEnd.toISOString(),
    }),
  });
  const thirdSessionId = thirdSessionRes.data?.data?._id;
  await request(`/sessions/${thirdSessionId}/book`, {
    method: 'POST',
    body: JSON.stringify({ userId: createdUserId }),
  });

  const userSessionsRes = await request(`/users/${createdUserId}/sessions`);
  assert(
    userSessionsRes.status === 200 &&
      Array.isArray(userSessionsRes.data?.data?.upcomingSessions) &&
      Array.isArray(userSessionsRes.data?.data?.completedSessions),
    'API 6: GET /users/:id/sessions returns separate upcomingSessions and completedSessions',
    userSessionsRes
  );

  const upcoming = userSessionsRes.data?.data?.upcomingSessions;
  const completed = userSessionsRes.data?.data?.completedSessions;
  assert(
    upcoming.some((s: any) => s._id === thirdSessionId) &&
      completed.some((s: any) => s._id === createdSessionId),
    'API 6: Aggregation $facet correctly separates BOOKED into upcoming and COMPLETED into completed',
    { upcomingCount: upcoming.length, completedCount: completed.length }
  );

  // 9. Authentication & RBAC Verification Tests
  console.log('\n--- Testing Authentication & RBAC ---');

  // Test 9.1: Student Login with valid credentials
  const studentLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'saurabh.agnihotri@example.com',
      password: 'Password@123',
    }),
  });
  assert(
    studentLoginRes.status === 200 &&
      !!studentLoginRes.data?.data?.accessToken &&
      studentLoginRes.data?.data?.user?.role === 'STUDENT',
    'POST /auth/login returns JWT accessToken and STUDENT profile',
    studentLoginRes
  );
  const studentToken = studentLoginRes.data?.data?.accessToken;

  // Test 9.2: Teacher Login
  const teacherLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'abhishek.singh@example.com',
      password: 'Password@123',
    }),
  });
  assert(
    teacherLoginRes.status === 200 &&
      !!teacherLoginRes.data?.data?.accessToken &&
      teacherLoginRes.data?.data?.user?.role === 'TEACHER',
    'POST /auth/login returns JWT accessToken and TEACHER profile',
    teacherLoginRes
  );
  const teacherToken = teacherLoginRes.data?.data?.accessToken;
  const teacherLinkedId = teacherLoginRes.data?.data?.user?.teacherId;

  // Test 9.3: Invalid password yields 401
  const badLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'saurabh.agnihotri@example.com',
      password: 'WrongPassword',
    }),
  });
  assert(
    badLoginRes.status === 401,
    'POST /auth/login rejects wrong password with 401 Unauthorized',
    badLoginRes
  );

  // Test 9.4: Profile endpoint GET /auth/me with Bearer token
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(
    meRes.status === 200 && meRes.data?.data?.email === 'saurabh.agnihotri@example.com',
    'GET /auth/me validates Bearer token and returns authenticated user',
    meRes
  );

  // Test 9.5: RBAC - Student forbidden from scheduling session (API 2)
  const rbacSlotStart = new Date(Date.now() + 400000000 + Math.floor(Math.random() * 10000000));
  const rbacSlotEnd = new Date(rbacSlotStart.getTime() + 3600000);
  const studentCreateSessionRes = await request('/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      teacherId: createdTeacherId,
      startTime: rbacSlotStart.toISOString(),
      endTime: rbacSlotEnd.toISOString(),
    }),
  });
  assert(
    studentCreateSessionRes.status === 403,
    'RBAC: Student forbidden from POST /sessions (yields 403 Forbidden)',
    studentCreateSessionRes
  );

  // Test 9.6: RBAC - Teacher allowed to schedule session (API 2)
  const teacherCreateSessionRes = await request('/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({
      teacherId: createdTeacherId,
      startTime: rbacSlotStart.toISOString(),
      endTime: rbacSlotEnd.toISOString(),
    }),
  });
  assert(
    teacherCreateSessionRes.status === 201 && !!teacherCreateSessionRes.data?.data?._id,
    'RBAC: Teacher successfully creates session with Bearer token',
    teacherCreateSessionRes
  );
  const rbacSessionId = teacherCreateSessionRes.data?.data?._id;

  // Test 9.7: RBAC - Student allowed to book session (API 4) with auto-token injection
  const studentBookRes = await request(`/sessions/${rbacSessionId}/book`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({}),
  });
  assert(
    studentBookRes.status === 200 && studentBookRes.data?.data?.status === 'BOOKED',
    'RBAC: Student successfully books session with Bearer token (auto userId injection)',
    studentBookRes
  );

  // Test 9.8: RBAC - Student forbidden from completing session (API 5)
  const studentCompleteRes = await request(`/sessions/${rbacSessionId}/complete`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(
    studentCompleteRes.status === 403,
    'RBAC: Student forbidden from PATCH /sessions/:id/complete (yields 403 Forbidden)',
    studentCompleteRes
  );

  // Test 9.9: RBAC - Teacher allowed to complete session (API 5)
  const teacherCompleteRes = await request(`/sessions/${rbacSessionId}/complete`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  assert(
    teacherCompleteRes.status === 200 && teacherCompleteRes.data?.data?.status === 'COMPLETED',
    'RBAC: Teacher successfully marks session COMPLETED with Bearer token',
    teacherCompleteRes
  );

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
