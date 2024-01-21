export default async () => await (await fetch('/assets/data.json', { headers: { 'Accept-Encoding': 'application/json'} }).json());
