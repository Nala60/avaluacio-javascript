const fn = async () => await (await fetch('/assets/data.json', { headers: { 'Accept-Encoding': 'application/json'} }).json());
export default fn;
