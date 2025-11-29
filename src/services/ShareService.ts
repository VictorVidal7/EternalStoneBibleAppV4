/**
 * 📤 SHARE SERVICE
 * Servicio para compartir versículos y contenido de la Biblia
 * Creado para la gloria de Dios Todopoderoso
 *
 * Features:
 * - Share via sistema nativo
 * - Fallback a clipboard
 * - Múltiples formatos de compartir
 * - Analytics tracking
 * - Haptic feedback
 */

import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import {Alert, Platform} from 'react-native';
import * as Haptics from 'expo-haptics';
import {BibleVerse} from '../types/bible';
import {logger} from '../lib/utils/logger';

export interface ShareOptions {
  includeAppPromo?: boolean;
  includeVersion?: boolean;
  customMessage?: string;
}

export class ShareService {
  /**
   * Comparte un versículo de la Biblia
   */
  static async shareVerse(
    verse: BibleVerse,
    reference: string,
    options: ShareOptions = {},
  ): Promise<boolean> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const message = this.formatVerseMessage(verse, reference, options);

      // Intentar compartir nativamente
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(message, {
          mimeType: 'text/plain',
          dialogTitle: 'Compartir Versículo',
        });

        logger.info('Verse shared successfully', {
          component: 'ShareService',
          action: 'shareVerse',
          reference,
        });

        return true;
      } else {
        // Fallback: copiar al portapapeles
        await this.copyToClipboard(message);
        return true;
      }
    } catch (error) {
      logger.error('Error sharing verse', error as Error, {
        component: 'ShareService',
        action: 'shareVerse',
        reference,
      });

      // Fallback en caso de error
      await this.copyToClipboard(
        this.formatVerseMessage(verse, reference, options),
      );
      return false;
    }
  }

  /**
   * Comparte múltiples versículos
   */
  static async shareMultipleVerses(
    verses: BibleVerse[],
    bookName: string,
    chapter: number,
    options: ShareOptions = {},
  ): Promise<boolean> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const message = this.formatMultipleVersesMessage(
        verses,
        bookName,
        chapter,
        options,
      );

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(message, {
          mimeType: 'text/plain',
          dialogTitle: 'Compartir Versículos',
        });

        logger.info('Multiple verses shared successfully', {
          component: 'ShareService',
          action: 'shareMultipleVerses',
          count: verses.length,
        });

        return true;
      } else {
        await this.copyToClipboard(message);
        return true;
      }
    } catch (error) {
      logger.error('Error sharing multiple verses', error as Error, {
        component: 'ShareService',
        action: 'shareMultipleVerses',
      });

      await this.copyToClipboard(
        this.formatMultipleVersesMessage(verses, bookName, chapter, options),
      );
      return false;
    }
  }

  /**
   * Comparte un plan de lectura
   */
  static async shareReadingPlan(
    planName: string,
    planDescription: string,
  ): Promise<boolean> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const message = `📖 Plan de Lectura: ${planName}\n\n${planDescription}\n\n¡Únete a mí en este viaje espiritual!\n\n✨ Descarga Eternal Bible y empieza tu plan hoy.`;

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(message, {
          mimeType: 'text/plain',
          dialogTitle: 'Compartir Plan de Lectura',
        });
        return true;
      } else {
        await this.copyToClipboard(message);
        return true;
      }
    } catch (error) {
      logger.error('Error sharing reading plan', error as Error);
      return false;
    }
  }

  /**
   * Comparte logros/achievements
   */
  static async shareAchievement(
    achievementTitle: string,
    achievementDescription: string,
  ): Promise<boolean> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const message = `🏆 ¡Logro Desbloqueado!\n\n${achievementTitle}\n${achievementDescription}\n\n✨ Eternal Bible - Tu viaje espiritual`;

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(message, {
          mimeType: 'text/plain',
          dialogTitle: 'Compartir Logro',
        });
        return true;
      } else {
        await this.copyToClipboard(message);
        return true;
      }
    } catch (error) {
      logger.error('Error sharing achievement', error as Error);
      return false;
    }
  }

  /**
   * Formatea el mensaje de un versículo
   */
  private static formatVerseMessage(
    verse: BibleVerse,
    reference: string,
    options: ShareOptions,
  ): string {
    const {
      includeAppPromo = true,
      includeVersion = true,
      customMessage,
    } = options;

    let message = '';

    // Custom message al inicio (opcional)
    if (customMessage) {
      message += `${customMessage}\n\n`;
    }

    // Versículo principal
    message += `"${verse.text}"\n\n`;

    // Referencia
    if (includeVersion) {
      message += `— ${reference} (${verse.version || 'RVR1960'})`;
    } else {
      message += `— ${reference}`;
    }

    // Promo de la app (opcional)
    if (includeAppPromo) {
      message += `\n\n✨ Compartido desde Eternal Bible`;
    }

    return message;
  }

  /**
   * Formatea mensaje de múltiples versículos
   */
  private static formatMultipleVersesMessage(
    verses: BibleVerse[],
    bookName: string,
    chapter: number,
    options: ShareOptions,
  ): string {
    const {includeAppPromo = true, customMessage} = options;

    let message = '';

    if (customMessage) {
      message += `${customMessage}\n\n`;
    }

    message += `📖 ${bookName} ${chapter}\n\n`;

    verses.forEach(verse => {
      message += `${verse.verse}. ${verse.text}\n\n`;
    });

    message += `— ${bookName} ${chapter}:${verses[0]?.verse}-${verses[verses.length - 1]?.verse}`;

    if (includeAppPromo) {
      message += `\n\n✨ Compartido desde Eternal Bible`;
    }

    return message;
  }

  /**
   * Copia texto al portapapeles con feedback
   */
  private static async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert('📋 Copiado', 'El contenido se ha copiado al portapapeles', [
        {text: 'OK'},
      ]);

      logger.info('Content copied to clipboard', {
        component: 'ShareService',
        action: 'copyToClipboard',
      });
    } catch (error) {
      logger.error('Error copying to clipboard', error as Error);

      Alert.alert('Error', 'No se pudo copiar al portapapeles', [{text: 'OK'}]);
    }
  }

  /**
   * Verifica si el sharing está disponible
   */
  static async isSharingAvailable(): Promise<boolean> {
    try {
      return await Sharing.isAvailableAsync();
    } catch {
      return false;
    }
  }
}

export default ShareService;
