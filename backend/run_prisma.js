const { exec } = require('child_process');
exec('npx prisma db push --accept-data-loss', (err, stdout, stderr) => {
    require('fs').writeFileSync('push_err.txt', stderr || '');
    require('fs').writeFileSync('push_out.txt', stdout || '');
    console.log('Done running prisma');
});
