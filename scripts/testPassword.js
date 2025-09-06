const bcrypt = require('bcryptjs');

// Sample password for testing
const password = 'TestPassword123';

// Hash the password
bcrypt.hash(password, 10, (err, hashedPassword) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }

  console.log('Hashed Password:', hashedPassword);

  // Compare the entered password with the hashed password
  bcrypt.compare(password, hashedPassword, (err, isMatch) => {
    if (err) {
      console.error('Error comparing passwords:', err);
      return;
    }

    console.log('Do the passwords match?', isMatch); // Should return true
  });
});
