import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLogin, validateRegisterStep1 } from '../utils/helper.ts';

const dummyT = (key) => key;

test('Frontend validateLogin empty email and password', () => {
    const errors = {};
    validateLogin({ email: '', password: '' }, errors, dummyT);
    assert.equal(errors.email, 'validation.emailRequired');
    assert.equal(errors.password, 'validation.passwordRequired');
});

test('Frontend validateLogin valid email and password', () => {
    const errors = {};
    validateLogin({ email: 'user@example.com', password: 'Password123' }, errors, dummyT);
    assert.equal(Object.keys(errors).length, 0);
});

test('Frontend validateRegisterStep1 invalid email & short name', () => {
    const errors = {};
    validateRegisterStep1({
        fullName: 'Ab',
        email: 'invalid-email',
        password: 'pass',
        age: 25,
        gender: 'Male'
    }, errors, dummyT);

    assert.equal(errors.fullName, 'validation.fullNameLength');
    assert.equal(errors.email, 'validation.invalidEmail');
});
