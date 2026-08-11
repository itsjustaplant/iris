/**
 * Returns whether the request reached the app through a loopback address.
 *
 * This identifies requests made via localhost on the machine running Iris.
 * Requests made by other devices using the server's LAN address are not local.
 */
export function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "[::1]" ||
    hostname === "::1"
  ) {
    return true;
  }

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

  if (!ipv4Match) {
    return false;
  }

  const octets = ipv4Match.slice(1).map(Number);
  return octets.every((octet) => octet <= 255) && octets[0] === 127;
}
