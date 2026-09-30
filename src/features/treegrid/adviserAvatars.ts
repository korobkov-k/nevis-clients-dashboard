/**
 * Adviser photos exported from the Figma design, keyed by source node ID. The API has no
 * avatar field, so unknown advisers fall back to initials.
 */
const AVATARS: Readonly<Record<string, string>> = {
  'e3c4637b-2f21-4b7e-883e-b13ae1a6df6a': '/avatars/anna-blackwood.jpg',
  'afe9ebc0-6c35-4690-80b0-20e9bc0d8c7d': '/avatars/james-walker.jpg',
  'bb012770-02d3-4999-aa08-c11a9065235d': '/avatars/maria-gutierrez.jpg',
  '61cd9425-2d8e-456f-b228-f7e7c6a76e5d': '/avatars/robert-chen.jpg',
  '3e4efd29-e7e4-4695-a1dc-6f3b0853c19d': '/avatars/sarah-smith.jpg',
};

export function getAdviserAvatar(nodeId: string): string | undefined {
  return AVATARS[nodeId];
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? '';
  const last = words.length > 1 ? (words.at(-1)?.charAt(0) ?? '') : '';
  return (first + last).toLocaleUpperCase();
}
