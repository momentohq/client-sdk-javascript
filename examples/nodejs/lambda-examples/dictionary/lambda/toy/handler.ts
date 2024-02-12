// Assuming these are placed outside the Lambda handler to persist across invocations (if the container is reused)
const startTime = Date.now();
let numSecondsElapsed = 0;

// This setInterval will start counting from the time this execution context is initialized
// Note: This timer will only be accurate as long as this Lambda execution context is alive and reused
setInterval(() => {
  numSecondsElapsed += 1;
}, 1000);

export const handler = async function(event: any = {}, context: any) {
  // Calculate elapsed time in seconds since the start of this execution context
  const calculatedNumberMillisecondsElapsed = Date.now() - startTime;
  const calculatedNumberSecondsElapsed = Math.floor(calculatedNumberMillisecondsElapsed / 1000);

  // Log both elapsed times for comparison
  console.log(`Calculated: ${calculatedNumberSecondsElapsed} seconds, Background Task: ${numSecondsElapsed} seconds`);

  // Return or process your Lambda's logic here
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello from Lambda! Calculated: ${calculatedNumberSecondsElapsed} seconds, Background Task: ${numSecondsElapsed} seconds`,
    }),
  };
};
