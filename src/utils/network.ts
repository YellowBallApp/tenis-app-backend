import os from 'os';

/**
 * Bilgisayarın local network IP adresini döndürür
 * @returns Local network IP adresi (örn: 192.168.1.103)
 */
export function getLocalNetworkIP(): string {
  const interfaces = os.networkInterfaces();
  
  // Öncelik sırasına göre network interface'leri kontrol et
  const priorityInterfaces = ['Wi-Fi', 'Ethernet', 'eth0', 'wlan0', 'en0', 'en1'];
  
  // Öncelikli interface'leri kontrol et
  for (const interfaceName of priorityInterfaces) {
    const networkInterface = interfaces[interfaceName];
    if (networkInterface) {
      for (const addr of networkInterface) {
        // IPv4 ve internal olmayan (127.0.0.1) adresleri al
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  
  // Öncelikli interface bulunamazsa tüm interface'leri tara
  for (const interfaceName of Object.keys(interfaces)) {
    const networkInterface = interfaces[interfaceName];
    if (networkInterface) {
      for (const addr of networkInterface) {
        // IPv4, internal olmayan ve local network IP'leri (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (addr.family === 'IPv4' && !addr.internal) {
          const ip = addr.address;
          // Local network IP kontrolü
          if (
            ip.startsWith('192.168.') ||
            ip.startsWith('10.') ||
            (ip.startsWith('172.') && 
             parseInt(ip.split('.')[1]) >= 16 && 
             parseInt(ip.split('.')[1]) <= 31)
          ) {
            return ip;
          }
        }
      }
    }
  }
  
  // Hiçbir şey bulunamazsa localhost döndür
  return '127.0.0.1';
}

