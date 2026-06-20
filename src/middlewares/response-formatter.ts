export const sendResponse = (
  res: any,
  {
    statusCode = 200,
    success = true,
    message = "Success",
    data = null,
  }
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};