
## Generate admin.pem and admin-key.pem
1. openssl genrsa -out root-ca-key.pem 2048
2. openssl req -new -x509 -sha256 -key root-ca-key.pem -out root-ca.pem -days 730
3. openssl genrsa -out admin-key-temp.pem 2048
4. openssl pkcs8 -inform PEM -outform PEM -in admin-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out admin-key.pem
5. openssl req -new -key admin-key.pem -out admin.csr
6. openssl x509 -req -in admin.csr -CA root-ca.pem -CAkey root-ca-key.pem -CAcreateserial -sha256 -out admin.pem -days 730

## Generate node1.pem and node1-key.pem
1. openssl genrsa -out node1-key-temp.pem 2048
2. openssl pkcs8 -inform PEM -outform PEM -in node1-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out node1-key.pem
3. openssl req -new -key node1-key.pem -out node1.csr
4. echo 'subjectAltName=DNS:node1.dns.a-record' > node1.ext
5. openssl x509 -req -in node1.csr -CA root-ca.pem -CAkey root-ca-key.pem -CAcreateserial -sha256 -out node1.pem -days 730 -extfile node1.ext

