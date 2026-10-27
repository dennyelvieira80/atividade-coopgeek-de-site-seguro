import { expect, test } from '@playwright/test';

test.describe('StudyFlow AI — fumaça', () => {
  test('exibe o formulário de login para visitante anônimo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'StudyFlow AI' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    // Visitante anônimo não vê a área de planos.
    await expect(page.getByText('Meus cronogramas')).toHaveCount(0);
  });

  test('publica Content Security Policy restritiva', async ({ page }) => {
    await page.goto('/');
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  test('valida o login no cliente antes de chamar a API', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('E-mail').fill('invalido');
    await page.getByLabel('Senha').fill('123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toContainText('E-mail inválido');
  });
});
