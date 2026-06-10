const BASE_URL = 'http://localhost:4000/api';

const USER = {
  name: 'John Employee',
  email: `john${Date.now()}@example.com`,
  password: 'Password123!',
  department: 'IT'
};

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const body = await response.json().catch(() => ({}));

  return {
    status: response.status,
    body
  };
}

async function register() {
  console.log('Registering user...');

  const result = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(USER)
  });

  console.log(result.body);
}

async function login() {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: USER.email,
      password: USER.password
    })
  });
}

async function getAccessToken() {
  let result = await login();

  if (result.status === 401 || result.body?.error) {
    await register();
    result = await login();
  }

  console.log('Login response:', result.body);

  return (
    result.body?.data?.accessToken ||
    result.body?.accessToken
  );
}

async function main() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('Unable to obtain JWT token');
  }

  console.log('JWT Token:');
  console.log(accessToken);

  // Continue with:
  // PATCH /users/me/fcm-token
  // POST /tickets
  // GET /notifications
}

main().catch(console.error);