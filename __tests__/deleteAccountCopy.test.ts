import {translations} from '../src/i18n/translations';

/**
 * R9-24 — the «Eliminar cuenta» dialog must not send the person to an action
 * that does not delete their content. «Resetear Datos de la Biblia» only
 * reloads the verses (its own copy says favorites, notes and highlights are
 * not affected), and no action in the app deletes what is on the device, so
 * the dialog says plainly that the device copy stays.
 */
describe('delete-account dialog copy (R9-24)', () => {
  const languages = ['es', 'en'] as const;

  it.each(languages)(
    '%s: does not point to «Resetear Datos» as a way to delete local data',
    lang => {
      const t = translations[lang];
      const message = t.auth.deleteAccountConfirmMessage;
      expect(message).not.toContain(t.settings.resetData);
      expect(message).not.toContain(t.settings.resetTitle);
      expect(message).not.toContain(t.settings.dataEntryTitle);
    },
  );

  it.each(languages)(
    '%s: the reset action itself still says user content is not affected',
    lang => {
      // The premise of the test above: if this ever stops holding (the reset
      // starts deleting user content), the dialog may point to it again.
      const t = translations[lang];
      expect(t.settings.resetMessage).toMatch(
        lang === 'es' ? /no se ven afectados/ : /not affected/i,
      );
    },
  );
});
