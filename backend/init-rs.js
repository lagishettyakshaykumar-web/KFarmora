const { MongoClient } = require('mongodb');

async function initiateReplicaSet() {
  const url = 'mongodb://localhost:27018';
  const client = new MongoClient(url, { directConnection: true });

  try {
    await client.connect();
    const db = client.db('admin');
    console.log('Connected to standalone node, initiating replica set...');
    const result = await db.command({
      replSetInitiate: {
        _id: 'rs0',
        members: [{ _id: 0, host: 'localhost:27018' }]
      }
    });
    console.log('Replica set initiated:', result);
  } catch (err) {
    if (err.codeName === 'AlreadyInitialized' || err.message.includes('already initialized')) {
      console.log('Replica set is already initialized.');
    } else {
      console.error('Error initiating replica set:', err);
    }
  } finally {
    await client.close();
    process.exit(0);
  }
}

initiateReplicaSet();
