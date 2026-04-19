import net from 'net';

const port = 3000;
const host = 'localhost';

const client = new net.Socket();

client.setTimeout(2000);

client.connect(port, host, () => {
    console.log(`Success: Port ${port} is open on ${host}.`);
    client.destroy();
});

client.on('data', (data) => {
    // console.log('Received: ' + data);
    client.destroy();
});

client.on('error', (err) => {
    console.error(`Error: Could not connect to port ${port} on ${host}. Details:`, err.message);
    console.error("Possibilities: Backend not running, listening on different port, or blocked.");
});

client.on('close', () => {
    // console.log('Connection closed');
});

client.on('timeout', () => {
    console.error('Timeout reached. Port might be filtered or blocked.');
    client.destroy();
});
