from bcrypt import gensalt, hashpw

password = b"abc123"
hashed_password = hashpw(password, gensalt())
print(hashed_password.decode())
