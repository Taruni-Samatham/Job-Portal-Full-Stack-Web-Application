const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'yerriy099@gmail.com' });
    if (user) {
      console.log('✅ FOUND USER:', JSON.stringify(user, null, 2));
    } else {
      console.log('❌ USER NOT FOUND');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUser();
