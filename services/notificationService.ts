
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones de escritorio.");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

export const sendNotification = (title: string, body: string, type: 'success' | 'error') => {
    if (Notification.permission === "granted") {
        // Iconos simples en base64 o URLs para diferenciar el estado
        const icon = type === 'success' 
            ? 'https://cdn-icons-png.flaticon.com/512/190/190411.png' // Check verde
            : 'https://cdn-icons-png.flaticon.com/512/190/190406.png'; // X roja

        const notification = new Notification(title, {
            body: body,
            icon: icon,
            silent: false,
        });

        // Cerrar automáticamente después de 5 segundos
        setTimeout(() => notification.close(), 5000);
        
        // Enfocar la ventana si el usuario hace clic
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
};
