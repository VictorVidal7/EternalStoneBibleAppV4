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

import {Share} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import {haptics} from '@lib/haptics';
import {BibleVerse} from '../types/bible';
import {logger} from '../lib/utils/logger';
import {getTranslations} from '../i18n/languageUtils';
import type {TranslationKeys} from '../i18n/translations';

export interface ShareOptions {
  includeAppPromo?: boolean;
  includeVersion?: boolean;
  customMessage?: string;
}

/**
 * ShareService is a static, non-React service — it has no access to
 * `useToast()`. Callers that want themed (rather than silent) clipboard-
 * fallback feedback pass this callback; it's invoked instead of the old
 * native `Alert.alert` so the caller can route it through its own toast.
 */
export type ShareFeedback = (
  variant: 'success' | 'error',
  message: string,
) => void;

export class ShareService {
  /**
   * Comparte un versículo de la Biblia
   */
  static async shareVerse(
    verse: BibleVerse,
    reference: string,
    options: ShareOptions = {},
    onFeedback?: ShareFeedback,
  ): Promise<boolean> {
    const t = await getTranslations();
    const message = this.formatVerseMessage(verse, reference, options, t);
    try {
      haptics.tap();

      // Intentar compartir nativamente
      await Share.share(
        {message},
        {dialogTitle: t.shareService.verseDialogTitle},
      );

      logger.info('Verse shared successfully', {
        component: 'ShareService',
        action: 'shareVerse',
        reference,
      });

      return true;
    } catch (error) {
      logger.error('Error sharing verse', error as Error, {
        component: 'ShareService',
        action: 'shareVerse',
        reference,
      });

      // Fallback en caso de error
      await this.copyToClipboard(message, t, onFeedback);
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
    onFeedback?: ShareFeedback,
  ): Promise<boolean> {
    const t = await getTranslations();
    const message = this.formatMultipleVersesMessage(
      verses,
      bookName,
      chapter,
      options,
      t,
    );
    try {
      haptics.tap();

      await Share.share(
        {message},
        {dialogTitle: t.shareService.versesDialogTitle},
      );

      logger.info('Multiple verses shared successfully', {
        component: 'ShareService',
        action: 'shareMultipleVerses',
        count: verses.length,
      });

      return true;
    } catch (error) {
      logger.error('Error sharing multiple verses', error as Error, {
        component: 'ShareService',
        action: 'shareMultipleVerses',
      });

      await this.copyToClipboard(message, t, onFeedback);
      return false;
    }
  }

  /**
   * Comparte un plan de lectura
   */
  static async shareReadingPlan(
    planName: string,
    planDescription: string,
    onFeedback?: ShareFeedback,
  ): Promise<boolean> {
    const t = await getTranslations();
    const message = t.shareService.planMessage
      .replace('{{name}}', planName)
      .replace('{{description}}', planDescription);
    try {
      haptics.tap();

      await Share.share(
        {message},
        {dialogTitle: t.shareService.planDialogTitle},
      );
      return true;
    } catch (error) {
      logger.error('Error sharing reading plan', error as Error);
      await this.copyToClipboard(message, t, onFeedback);
      return false;
    }
  }

  /**
   * Comparte logros/achievements
   */
  static async shareAchievement(
    achievementTitle: string,
    achievementDescription: string,
    onFeedback?: ShareFeedback,
  ): Promise<boolean> {
    const t = await getTranslations();
    const message = t.shareService.achievementMessage
      .replace('{{title}}', achievementTitle)
      .replace('{{description}}', achievementDescription);
    try {
      haptics.press();

      await Share.share(
        {message},
        {dialogTitle: t.shareService.achievementDialogTitle},
      );
      return true;
    } catch (error) {
      logger.error('Error sharing achievement', error as Error);
      await this.copyToClipboard(message, t, onFeedback);
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
    t: TranslationKeys,
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
      message += `\n\n${t.shareService.promo}`;
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
    t: TranslationKeys,
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
      message += `\n\n${t.shareService.promo}`;
    }

    return message;
  }

  /**
   * Copia texto al portapapeles con feedback
   */
  private static async copyToClipboard(
    text: string,
    t: TranslationKeys,
    onFeedback?: ShareFeedback,
  ): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
      haptics.success();

      onFeedback?.('success', t.shareService.copiedMessage);

      logger.info('Content copied to clipboard', {
        component: 'ShareService',
        action: 'copyToClipboard',
      });
    } catch (error) {
      logger.error('Error copying to clipboard', error as Error);

      onFeedback?.('error', t.shareService.copyErrorMessage);
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
