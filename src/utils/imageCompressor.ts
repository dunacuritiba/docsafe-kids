/**
 * Utilitário para redimensionamento e compressão automática de fotos de perfil.
 * Evita sobrecarga na rede e no banco de dados Supabase mantendo as imagens leves (~15KB a 30KB).
 */

export async function compressProfileImage(
  source: File | string,
  maxWidth = 320,
  maxHeight = 320,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processDataUrl = (url: string) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Se a imagem for maior que as dimensões máximas, calcula proporção mantendo aspecto
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback para url original caso falhe o contexto
            resolve(url);
            return;
          }

          // Suavização de alta qualidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          // Exportar sempre em JPEG otimizado
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          console.warn('Erro ao comprimir imagem via canvas:', err);
          resolve(url); // fallback
        }
      };

      img.onerror = (err) => {
        console.warn('Erro ao carregar imagem para compressão:', err);
        resolve(url); // fallback
      };

      img.src = url;
    };

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        processDataUrl(reader.result as string);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    } else {
      processDataUrl(source);
    }
  });
}
