export const sanitizeText = (text: string) => {
    return text.replace(/[<>]/g, ""); 
};