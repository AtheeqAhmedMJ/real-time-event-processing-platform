const { Kafka } = require("kafkajs");
const config = require("../config");

const kafka = new Kafka({
  clientId: "event-platform",
  brokers: config.KAFKA_BROKERS,
  retry: { retries: 5 },
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "event-platform-group" });

let _io = null; // Socket.io reference injected after init

const setIO = (io) => { _io = io; };

// --------------- Producer ---------------
const publishEvent = async (topic, message) => {
  await producer.send({
    topic,
    messages: [{ key: message.eventId, value: JSON.stringify(message) }],
  });
};

// --------------- Consumer ---------------
const startConsumer = async (handlers) => {
  await consumer.subscribe({
    topics: Object.values(config.KAFKA_TOPICS),
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payload = JSON.parse(message.value.toString());
      if (handlers[topic]) await handlers[topic](payload);
    },
  });
};

// --------------- Lifecycle ---------------
const connect = async () => {
  await producer.connect();
  await consumer.connect();
  console.log("✅ Kafka connected");
};

const disconnect = async () => {
  await producer.disconnect();
  await consumer.disconnect();
};

module.exports = { connect, disconnect, publishEvent, startConsumer, setIO, config: config.KAFKA_TOPICS };
