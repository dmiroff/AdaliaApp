import { fireEvent, render, screen, within } from '@testing-library/react';
import Inventory from './Inventory';

jest.mock('react-bootstrap/esm/Container', () => jest.requireActual('react-bootstrap/Container'));
jest.mock('../components/Equipment', () => () => <div>Панель снаряжения</div>);
jest.mock('../components/InventoryList', () => () => <div>Список предметов</div>);
jest.mock('../components/Wardrobe', () => () => <div>Панель гардероба</div>);
jest.mock('../components/HomeStorage', () => () => <div>Содержимое хранилища</div>);

test('the inventory offers home storage once and opens it from the main toolbar', () => {
  const { container } = render(<Inventory />);
  const storage = screen.getByRole('button', { name: '🏠 Домашнее хранилище' });
  const more = within(container.querySelector('.inventory-storage-menu'));
  expect(more.getByText('Зал облачений')).toBeTruthy();
  expect(more.queryByText('Домашнее хранилище')).toBeNull();

  fireEvent.click(storage);
  expect(screen.getByText('Содержимое хранилища')).toBeTruthy();
  expect(storage.getAttribute('aria-expanded')).toBe('true');
});
