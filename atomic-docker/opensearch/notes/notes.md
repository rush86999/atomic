## Steps
1. Generate certs via https://opensearch.org/docs/latest/security/configuration/generate-certificates/
2. active security plugin when running via docker: /usr/share/opensearch/plugins/opensearch-security/tools/securityadmin.sh
   1. To update to new settings, create backup
   2. ./securityadmin.sh -backup my-backup-directory \
  -icl \
  -nhnv \
  -cacert ../../../config/root-ca.pem \
  -cert ../../../config/kirk.pem \
  -key ../../../config/kirk-key.pem
3. 