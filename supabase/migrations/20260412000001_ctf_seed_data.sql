-- CTF Challenges - Retos de ejemplo
INSERT INTO public.ctf_challenges (title, description, category, difficulty, points, flag, hint, module_id, is_active) VALUES

-- OSINT
('Huella Digital', 'Un empleado ha filtrado información sensible en redes sociales. Encuentra su nombre de usuario filtrado en el siguiente texto: "Mi compañero @cyb3rn0b1_2026 compartió accidentalmente capturas del sistema interno en su perfil público". ¿Cuál es el nombre de usuario?', 'osint', 'easy', 50, 'flag{cyb3rn0b1_2026}', 'Busca el formato @usuario en el texto proporcionado.', 2, true),

('Información Expuesta', 'Un servidor mal configurado expone su archivo robots.txt en https://ejemplo-seguro.com/robots.txt. El contenido es: "User-agent: * Disallow: /admin/ Disallow: /backup/ Disallow: /tmp/database_dump.sql". ¿Qué archivo sensible está expuesto?', 'osint', 'medium', 100, 'flag{database_dump.sql}', 'Los archivos robots.txt revelan rutas que el administrador no quiere que sean indexadas.', 2, true),

('DNS Reconnaissance', 'Al realizar una consulta DNS al dominio meta-seguridad.lab, obtienes los siguientes registros: A record: 192.168.1.100, MX record: mail.meta-seguridad.lab, TXT record: "v=spf1 include:_spf.googlemail.com ~all", TXT record: "flag{spf_txt_dns_recon}". ¿Cuál es el flag oculto en los registros TXT?', 'osint', 'medium', 150, 'flag{spf_txt_dns_recon}', 'Los registros TXT de DNS pueden contener información valiosa incluida en la configuración SPF.', 7, true),

-- Criptografía
('César Clásico', 'Has interceptado el siguiente mensaje cifrado con un cifrado César de desplazamiento 3: "iodj{olidohiungrem_dodnub}". ¿Cuál es el mensaje original?', 'crypto', 'easy', 50, 'flag{flagefrendrama_alabama}', 'El cifrado César desplaza cada letra un número fijo de posiciones en el alfabeto. Prueba desplazar 3 posiciones hacia atrás.', 1, true),

('Base64 Oculto', 'Encontraste esta cadena sospechha en un log del servidor: "ZmxhZ3tiYXNlNjRfZGVjb2RpZmljYWRv}". ¿Qué mensaje oculta?', 'crypto', 'easy', 75, 'flag{base64_decodificado}', 'El formato Base64 usa caracteres A-Z, a-z, 0-9, + y /. Se decodifica fácilmente con herramientas online.', 1, true),

('Hash Identificado', 'Al analizar un archivo de contraseñas encontrado el siguiente hash: "5f4dcc3b5aa765d61d8327deb882cf99". Sabiendo que es un hash MD5, ¿qué contraseña original genera este hash?', 'crypto', 'medium', 150, 'flag{password}', 'Es uno de los hashes MD5 más conocidos. Prueba con las contraseñas más comunes del mundo.', 1, true),

-- Web
('Inyección SQL Básica', 'Una página de login usa la consulta: "SELECT * FROM users WHERE username = ''[INPUT]'' AND password = ''[INPUT]''". Si introduces como usuario: "admin'' OR ''1''=''1" y cualquier contraseña, ¿qué tipo de vulnerabilidad estás explotando?', 'web', 'easy', 75, 'flag{sql_injection}', 'La inyección SQL manipula la consulta SQL mediante entrada no sanitizada. El OR 1=1 siempre es verdadero.', 10, true),

('XSS Reflejado', 'En un foro, descubres que al escribir "<script>alert(''test'')</script>" en un campo de búsqueda, el navegador ejecuta el código JavaScript. ¿Qué vulnerabilidad es esta?', 'web', 'easy', 50, 'flag{xss_reflejado}', 'XSS permite inyectar código JavaScript que se ejecuta en el navegador de la víctima.', 10, true),

('Cookie Insegura', 'Al analizar las cookies de sesión de una aplicación web, encuentras: "session_id=eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ==". Al decodificar el Base64 obtienes: {"user":"admin","role":"admin"}. ¿Qué vulnerabilidad de seguridad presenta esta cookie?', 'web', 'medium', 150, 'flag{cookie_manipulation}', 'La cookie contiene información sensible sin cifrar ni firmar. Un atacante puede modificarla cambiando el Base64.', 10, true),

-- Forense
('Metadatos Ocultos', 'Descargaste una imagen sospechha de un caso de investigación. Al examinar sus metadatos EXIF, encuentras: Camera: Canon EOS 5D, GPS Latitude: 40.4168, GPS Longitude: -3.7038, Date: 2026-03-15. ¿En qué ciudad fue tomada la fotografía?', 'forensics', 'easy', 75, 'flag{madrid}', 'Las coordenadas 40.4168, -3.7038 corresponden a una capital europea conocida por su Museo del Prado.', 1, true),

('Archivo Camuflado', 'Un investigador encontró un archivo llamado "vacaciones.jpg" que pesa 15MB, inusualmente grande para una imagen. Al ejecutar "file vacaciones.jpg" obtiene: "PNG image data, 1920x1080, 8-bit/color RGBA, non-interlaced". ¿Qué técnica de esteganografía podría estar ocultando datos?', 'forensics', 'medium', 150, 'flag{esteganografia}', 'La esteganografía oculta información dentro de archivos multimedia. El tamaño inusual del archivo es una pista.', 9, true),

('Log Sospechoso', 'En un log de acceso de Apache encuentras la siguiente línea: "192.168.1.50 - - [15/Mar/2026:10:23:45 +0100] "GET /../../etc/passwd HTTP/1.1" 200 1234". ¿Qué tipo de ataque se está intentando?', 'forensics', 'medium', 125, 'flag{path_traversal}', 'La secuencia /../ intenta navegar fuera del directorio raíz del servidor para acceder a archivos del sistema.', 11, true),

-- Redes
('Puertos Abiertos', 'Al realizar un escaneo de puertos a un servidor con nmap -sV 10.0.0.1, obtienes: PORT 22/tcp open ssh OpenSSH 8.9, PORT 80/tcp open http Apache 2.4.52, PORT 443/tcp open https Apache 2.4.52, PORT 3306/tcp open mysql MySQL 8.0.31. ¿Cuál de estos servicios NO debería estar expuesto directamente a Internet?', 'network', 'easy', 75, 'flag{mysql_3306}', 'Los puertos de bases de datos como MySQL (3306) no deben estar accesibles directamente desde Internet.', 6, true),

('ARP Spoofing', 'En una red local, un atacante envía paquetes ARP falsificados diciendo que su MAC corresponde a la IP del gateway. Los paquetes legítimos del gateway real se pierden. ¿Qué tipo de ataque es este?', 'network', 'medium', 150, 'flag{arp_spoofing}', 'El envenenamiento ARP asocia una MAC falsa con una IP legítima para interceptar tráfico.', 7, true),

-- Misc
'Codificación Doble', 'Encuentras la siguiente cadena en un ataque: "%2566%256c%2561%2567%257b%2564%256f%2562%256c%2565%255f%2565%256e%2563%256f%2564%2569%256e%2567%257d". ¿Qué técnica se usó para ocultar el payload?', 'misc', 'medium', 100, 'flag{double_encoding}', 'La codificación doble URL cifra los caracteres % como %25, haciendo que %26 se convierta en %2526.', 10, true),

('Análisis de Cabecera', 'Un email recibido tiene las siguientes cabeceras: Received: from mail.atacante.evil (192.168.99.1), Received: by mail.empresa.com (192.168.1.10), X-Spam-Status: Yes, score=8.5, Authentication-Results: dkim=fail, spf=fail. ¿Qué conclusión puedes sacar?', 'misc', 'hard', 200, 'flag{phishing_spam}', 'SPF y DKIM fallados + alta puntuación de spam indican un correo de phishing.', 2, true);