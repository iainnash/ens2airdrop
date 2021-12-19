addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

/**
 * Many more examples available at:
 *   https://developers.cloudflare.com/workers/examples
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const { pathname, searchParams, search } = new URL(request.url);

  if (request.method === 'OPTIONS'){
    return new Response('', {status: 204, headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type, Authorization'
    }})
  }

  if (pathname.startsWith("/2/tweets/search/recent")) {
    const response = await fetch(`https://api.twitter.com${pathname}${search}`, {
      headers: request.headers
    });
    const text = await response.text()
    var oldHeaders = response.headers;

     const newHeaders = {
      'access-control-allow-origin': '*',
      //'content-type': oldHeaders['content-type'],
      'content-type': 'application/json',
      'max-age': '0',
      //'content-length': oldHeaders['content-length'],
    }

return new Response(text, {status: response.status, headers: newHeaders})
    
    
    return response;
  }

  if (pathname.startsWith("/status")) {
    const httpStatusCode = Number(pathname.split("/")[2]);

    return Number.isInteger(httpStatusCode)
      ? fetch("https://http.cat/" + httpStatusCode)
      : new Response("That's not a valid HTTP status code.");
  }

  return fetch("https://welcome.developers.workers.dev");
}
