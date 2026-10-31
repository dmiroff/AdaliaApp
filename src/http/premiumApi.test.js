import apiClient from './apiClient';
import { premiumPurchase } from './premiumApi';

jest.mock('./apiClient', () => ({ post: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

test('rename sends the exact entered name to the authenticated purchase endpoint', async () => {
  apiClient.post.mockResolvedValue({ data: { status: 200 } });
  await premiumPurchase(29, null, 1, { new_name: 'Снежный Кот' });
  expect(apiClient.post).toHaveBeenCalledWith('/premium-purchase', { product_id: 29, new_name: 'Снежный Кот' });
});

test('rename validation errors are preserved for the form', async () => {
  apiClient.post.mockRejectedValue({ response: { status: 400, data: { detail: 'Данное имя уже занято' } } });
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(premiumPurchase(29, null, 1, { new_name: 'Кот' })).rejects.toThrow('Данное имя уже занято');
  log.mockRestore();
});
