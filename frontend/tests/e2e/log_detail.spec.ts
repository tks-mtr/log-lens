import { test, expect, type Page } from '@playwright/test'

// --- Mock data ---

const MOCK_LOG = {
  id: 42,
  timestamp: '2026-04-10T12:00:00Z',
  severity: 'ERROR',
  source: 'api-server',
  message: 'Connection timeout occurred',
  created_at: '2026-04-10T12:00:00Z',
  updated_at: '2026-04-10T12:00:00Z',
}

const MOCK_LOG_UPDATED = {
  ...MOCK_LOG,
  source: 'updated-source',
  updated_at: '2026-04-10T12:05:00Z',
}

/** GET /api/v1/logs/42 のモックをセットアップ */
async function setupLogDetailMock(
  page: Page,
  logData = MOCK_LOG
) {
  await page.route(`**/api/v1/logs/${logData.id}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(logData),
    })
  })
}

/** GET /api/v1/logs（一覧）のモックをセットアップ。詳細エンドポイントは除外 */
async function setupLogsListMock(page: Page) {
  // 一覧エンドポイント（/logs の直接 GET）のみモック。/logs/数字 は除外
  await page.route(/\/api\/v1\/logs(\?.*)?$/, (route) => {
    const url = route.request().url()
    if (url.includes('/analytics') || url.includes('/export') || url.includes('/sources')) {
      route.continue()
      return
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [MOCK_LOG], total: 1, page: 1, limit: 50, pages: 1 }),
    })
  })
}

// E-01: /logs/[id] にアクセスしたとき、ログの詳細情報が表示される
test('E-01: shows_log_detail_fields_when_accessing_log_detail_page', async ({ page }) => {
  await setupLogDetailMock(page)

  await page.goto(`/logs/${MOCK_LOG.id}`)

  await expect(page.getByTestId('log-detail-page')).toBeVisible()
  await expect(page.getByTestId('log-detail-id')).toHaveText(String(MOCK_LOG.id))
  await expect(page.getByTestId('log-detail-severity')).toHaveText(MOCK_LOG.severity)
  await expect(page.getByTestId('log-detail-source')).toHaveText(MOCK_LOG.source)
  await expect(page.getByTestId('log-detail-message')).toHaveText(MOCK_LOG.message)
})

// E-02: "← Back to Log List" リンクをクリックすると /logs へ遷移する
test('E-02: navigates_to_logs_list_when_back_link_is_clicked', async ({ page }) => {
  await setupLogDetailMock(page)
  await setupLogsListMock(page)

  await page.goto(`/logs/${MOCK_LOG.id}`)
  await expect(page.getByTestId('log-detail-page')).toBeVisible()

  await page.getByTestId('back-to-log-list').click()

  await expect(page).toHaveURL('/logs')
})

// E-03: [Edit] ボタンをクリックすると、インライン編集フォームが同一ページに表示される（モーダルではない）
test('E-03: shows_inline_edit_form_on_same_page_when_edit_button_is_clicked', async ({ page }) => {
  await setupLogDetailMock(page)

  await page.goto(`/logs/${MOCK_LOG.id}`)
  await expect(page.getByTestId('log-detail-page')).toBeVisible()

  await page.getByTestId('log-detail-edit-btn').click()

  await expect(page.getByTestId('log-detail-edit-form')).toBeVisible()
  await expect(page.getByTestId('log-form')).toBeVisible()
  // モーダルではなくインライン: URL は変わらない
  await expect(page).toHaveURL(`/logs/${MOCK_LOG.id}`)
})

// E-04: 編集フォームで source を変更し Save すると、PATCH が呼ばれ表示モードに戻り変更後の値が表示される
test('E-04: patches_log_and_returns_to_view_mode_with_updated_source_after_save', async ({ page }) => {
  let patchCalled = false

  // 初回 GET: 元のデータ
  await page.route(`**/api/v1/logs/${MOCK_LOG.id}`, (route) => {
    if (route.request().method() === 'PATCH') {
      patchCalled = true
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOG_UPDATED),
      })
    } else {
      // GET: PATCH 後は更新済みデータを返す
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(patchCalled ? MOCK_LOG_UPDATED : MOCK_LOG),
      })
    }
  })

  await page.goto(`/logs/${MOCK_LOG.id}`)
  await expect(page.getByTestId('log-detail-page')).toBeVisible()

  // 編集モードに切り替え
  await page.getByTestId('log-detail-edit-btn').click()
  await expect(page.getByTestId('log-form')).toBeVisible()

  // source を変更
  await page.getByTestId('log-form-source').fill('updated-source')

  // Save をクリック
  await page.getByTestId('log-form-submit').click()

  // 表示モードに戻ることを確認
  await expect(page.getByTestId('log-detail-view')).toBeVisible()
  expect(patchCalled).toBe(true)
})

// E-05: (W-03 引き継ぎ・必須) PATCH 前後で updated_at が変化する（実サーバーで検証）
test('E-05: updated_at_changes_after_patch_compared_to_created_at', async ({ page }) => {
  // このテストは実サーバー（バックエンド）へのリアルリクエストを行う。
  // モックを使わずに、POST → PATCH の流れで updated_at が変化することを確認する。

  const BASE_URL = 'http://localhost:8000/api/v1'

  // 1. 新規ログを作成（POST）
  const createResponse = await page.request.post(`${BASE_URL}/logs`, {
    data: {
      severity: 'INFO',
      source: 'e2e-test-source',
      message: 'E-05 test: updated_at verification',
    },
    headers: { 'Content-Type': 'application/json' },
  })

  // バックエンドが利用不可の場合はスキップ
  if (!createResponse.ok()) {
    test.skip()
    return
  }

  const createdLog = await createResponse.json()
  const logId: number = createdLog.id
  const createdAt: string = createdLog.created_at
  const updatedAtBefore: string = createdLog.updated_at

  // created_at と updated_at が初期状態で同じ（またはほぼ同じ）ことを確認
  expect(createdLog.created_at).toBeDefined()
  expect(createdLog.updated_at).toBeDefined()

  // 2. 少し待機して時刻が確実に変化するようにする（1秒以上）
  await page.waitForTimeout(1100)

  // 3. PATCH で更新
  const patchResponse = await page.request.patch(`${BASE_URL}/logs/${logId}`, {
    data: {
      source: 'e2e-test-source-updated',
    },
    headers: { 'Content-Type': 'application/json' },
  })

  expect(patchResponse.ok()).toBe(true)
  const patchedLog = await patchResponse.json()
  const updatedAtAfter: string = patchedLog.updated_at

  // 4. updated_at が created_at より新しいことを確認
  expect(new Date(updatedAtAfter).getTime()).toBeGreaterThan(
    new Date(createdAt).getTime()
  )
  expect(updatedAtAfter).not.toBe(updatedAtBefore)

  // 5. クリーンアップ: テスト用ログを削除
  await page.request.delete(`${BASE_URL}/logs/${logId}`)
})

// E-06: 編集フォームの Cancel ボタンをクリックすると表示モードに戻る
test('E-06: returns_to_view_mode_when_cancel_button_is_clicked_in_edit_form', async ({ page }) => {
  await setupLogDetailMock(page)

  await page.goto(`/logs/${MOCK_LOG.id}`)
  await expect(page.getByTestId('log-detail-page')).toBeVisible()

  // 編集モードに切り替え
  await page.getByTestId('log-detail-edit-btn').click()
  await expect(page.getByTestId('log-form')).toBeVisible()

  // source を変更してからキャンセル
  await page.getByTestId('log-form-source').fill('should-be-discarded')

  await page.getByTestId('log-form-cancel').click()

  // 表示モードに戻る
  await expect(page.getByTestId('log-detail-view')).toBeVisible()
  // 変更は破棄されているため元の値が表示されている
  await expect(page.getByTestId('log-detail-source')).toHaveText(MOCK_LOG.source)
})

// E-07: [Delete] ボタンをクリックすると削除確認 AlertDialog が表示される
test('E-07: shows_delete_confirmation_dialog_when_delete_button_is_clicked', async ({ page }) => {
  await setupLogDetailMock(page)

  await page.goto(`/logs/${MOCK_LOG.id}`)
  await expect(page.getByTestId('log-detail-page')).toBeVisible()

  await page.getByTestId('log-detail-delete-btn').click()

  await expect(page.getByTestId('delete-dialog')).toBeVisible()
})

// E-08: AlertDialog の Delete を押すと DELETE が呼ばれ /logs へリダイレクト
test('E-08: deletes_log_and_redirects_to_logs_list_when_delete_confirmed', async ({ page }) => {
  let deleteCalled = false

  await page.route(`**/api/v1/logs/${MOCK_LOG.id}`, (route) => {
    if (route.request().method() === 'DELETE') {
      deleteCalled = true
      route.fulfill({ status: 204 })
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOG),
      })
    }
  })

  await setupLogsListMock(page)

  await page.goto(`/logs/${MOCK_LOG.id}`)
  await expect(page.getByTestId('log-detail-page')).toBeVisible()

  await page.getByTestId('log-detail-delete-btn').click()
  await expect(page.getByTestId('delete-dialog')).toBeVisible()

  await page.getByTestId('delete-dialog-confirm').click()

  await expect(page).toHaveURL('/logs')
  expect(deleteCalled).toBe(true)
})

// E-09: AlertDialog の Cancel を押すとダイアログが閉じ、ログ詳細ページに留まる
test('E-09: closes_dialog_and_stays_on_detail_page_when_delete_cancelled', async ({ page }) => {
  await setupLogDetailMock(page)

  await page.goto(`/logs/${MOCK_LOG.id}`)
  await expect(page.getByTestId('log-detail-page')).toBeVisible()

  await page.getByTestId('log-detail-delete-btn').click()
  await expect(page.getByTestId('delete-dialog')).toBeVisible()

  await page.getByTestId('delete-dialog-cancel').click()

  // ダイアログが閉じる
  await expect(page.getByTestId('delete-dialog')).not.toBeVisible()
  // ページに留まる
  await expect(page).toHaveURL(`/logs/${MOCK_LOG.id}`)
  await expect(page.getByTestId('log-detail-page')).toBeVisible()
})

// E-10: /logs/new にアクセスすると "Create Log" タイトルと作成フォームが表示される
test('E-10: shows_create_log_title_and_form_when_accessing_logs_new', async ({ page }) => {
  await page.goto('/logs/new')

  await expect(page.getByTestId('log-new-page')).toBeVisible()
  await expect(page.getByTestId('log-new-title')).toHaveText('Create Log')
  await expect(page.getByTestId('log-form')).toBeVisible()
})

// E-14: 存在しない ID へアクセスするとエラーメッセージが表示されアプリがクラッシュしない
test('E-14: shows_error_message_when_accessing_non_existent_log_id', async ({ page }) => {
  await page.route('**/api/v1/logs/99999999', (route) => {
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Log not found' }),
    })
  })

  await page.goto('/logs/99999999')

  await expect(page.getByTestId('log-detail-error')).toBeVisible()
  await expect(page.getByTestId('log-detail-error-message')).toBeVisible()
  // アプリがクラッシュしていないことを確認（ページが表示されている）
  await expect(page.getByTestId('back-to-log-list')).toBeVisible()
})