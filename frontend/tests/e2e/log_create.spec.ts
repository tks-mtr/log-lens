import { test, expect, type Page } from '@playwright/test'

// --- Mock data ---

const MOCK_CREATED_LOG = {
  id: 100,
  timestamp: '2026-04-12T10:00:00Z',
  severity: 'INFO',
  source: 'e2e-test',
  message: 'Created via E2E test',
  created_at: '2026-04-12T10:00:00Z',
  updated_at: '2026-04-12T10:00:00Z',
}

const MOCK_LOGS_LIST_RESPONSE = {
  data: [MOCK_CREATED_LOG],
  total: 1,
  page: 1,
  limit: 50,
  pages: 1,
}

/** POST /api/v1/logs のモックをセットアップ */
async function setupCreateLogMock(page: Page) {
  await page.route('**/api/v1/logs', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CREATED_LOG),
      })
    } else if (route.request().method() === 'GET') {
      const url = route.request().url()
      if (url.includes('/analytics') || url.includes('/export') || url.includes('/sources')) {
        route.continue()
        return
      }
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGS_LIST_RESPONSE),
      })
    } else {
      route.continue()
    }
  })
}

// E-11: フォームに全フィールドを入力して [Create Log] を押すと POST が呼ばれ /logs へリダイレクト
test('E-11: creates_log_and_redirects_to_logs_list_when_form_submitted_with_all_fields', async ({ page }) => {
  let postCalled = false

  await page.route('**/api/v1/logs', (route) => {
    const url = route.request().url()
    if (url.includes('/analytics') || url.includes('/export') || url.includes('/sources')) {
      route.continue()
      return
    }
    if (route.request().method() === 'POST') {
      postCalled = true
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CREATED_LOG),
      })
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGS_LIST_RESPONSE),
      })
    }
  })

  await page.goto('/logs/new')
  await expect(page.getByTestId('log-new-page')).toBeVisible()

  // フォーム入力
  await page.getByTestId('log-form-severity').selectOption('INFO')
  await page.getByTestId('log-form-source').fill('e2e-test')
  await page.getByTestId('log-form-message').fill('Created via E2E test')

  // Create Log ボタンをクリック
  await page.getByTestId('log-form-submit').click()

  // /logs へリダイレクト
  await expect(page).toHaveURL('/logs')
  expect(postCalled).toBe(true)
})

// E-12: Cancel ボタンを押すと /logs へ遷移する
test('E-12: navigates_to_logs_list_when_cancel_button_is_clicked_on_new_log_page', async ({ page }) => {
  await setupCreateLogMock(page)

  await page.goto('/logs/new')
  await expect(page.getByTestId('log-new-page')).toBeVisible()

  await page.getByTestId('log-form-cancel').click()

  await expect(page).toHaveURL('/logs')
})

// E-13: source を空のまま [Create Log] を押すとバリデーションエラーが表示されて送信されない
test('E-13: shows_validation_error_and_does_not_submit_when_source_is_empty', async ({ page }) => {
  let postCalled = false

  await page.route('**/api/v1/logs', (route) => {
    const url = route.request().url()
    if (url.includes('/analytics') || url.includes('/export') || url.includes('/sources')) {
      route.continue()
      return
    }
    if (route.request().method() === 'POST') {
      postCalled = true
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CREATED_LOG),
      })
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGS_LIST_RESPONSE),
      })
    }
  })

  await page.goto('/logs/new')
  await expect(page.getByTestId('log-new-page')).toBeVisible()

  // severity と message を入力するが source は空のまま
  await page.getByTestId('log-form-severity').selectOption('ERROR')
  await page.getByTestId('log-form-message').fill('Test message')

  await page.getByTestId('log-form-submit').click()

  // バリデーションエラーが表示される
  await expect(page.getByTestId('log-form-source-error')).toBeVisible()
  await expect(page.getByTestId('log-form-source-error')).toHaveText('Source is required')

  // 送信されていない
  expect(postCalled).toBe(false)
  // ページに留まる
  await expect(page).toHaveURL('/logs/new')
})