cd /Users/stefanhaselwimmer/Projects/openmap/opencarbonmap/app/frontend
npm run build
scp -r -i ~/.ssh/stefanhaselwimmer_rsa /Users/stefanhaselwimmer/Projects/openmap/opencarbonmap/app/frontend/build haselwimmer_gmail_com@35.208.248.138:/var/www/futurefarms_openmap/openmap/app/frontend
ssh -i ~/.ssh/stefanhaselwimmer_rsa haselwimmer_gmail_com@35.208.248.138

