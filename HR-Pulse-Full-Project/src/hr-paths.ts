export const inPulseII = window.location.pathname.startsWith('/hr/');
export const hrAsset = (path: string) => (inPulseII ? '/hr/' : '/') + path;
export const hrApiOrigin = inPulseII ? '/hr' : 'https://hr-api-cmll-783.azurewebsites.net';
export const hrSessionEndpoint = inPulseII ? '/hr/session/' : 'https://pulse.cmll.in/api/integrations/hr/';
