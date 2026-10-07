import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import UpgradeBuildingModal from './UpgradeBuildingModal';
import { getBuildingExperience } from '../../utils/buildingExperience';

let container, root;
beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});
afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    delete global.IS_REACT_ACT_ENVIRONMENT;
});

const renderPreview = async (experience, requiredLevel = 2) => {
    const start = jest.fn();
    const props = {
        selectedBuilding: { key: 'tower', name: 'Башня', currentLevel: 1, targetLevel: 2,
            resources: {114: 20}, essence: 10, constructionTime: 60,
            targetLevelInfo: {exp_for_levelup: 100, required_buildings: {heart: requiredLevel}} },
        showUpgradeModal: true, setShowUpgradeModal: jest.fn(), construction: {},
        getPossibleConcurrentConstructions: 1,
        renderResources: () => <div data-testid="resources">Бревно: 5/20; Воплощения: 3/10</div>,
        handleStartConstruction: start, buildings: {tower: {exp: experience, level: 1}, heart: {level: 2}},
        buildingsData: {heart: {name: 'Сердце поселения'}},
        storage: {'114': {count: 5}}, currentEssence: 3, loading: false,
    };
    await act(async () => root.render(<UpgradeBuildingModal {...props} />));
    return start;
};

test('shows actual experience before resources and all building prerequisites', async () => {
    const start = await renderPreview(150);
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('150/100');
    expect(dialog.textContent.indexOf('Опыт здания:')).toBeLessThan(dialog.textContent.indexOf('Необходимые ресурсы:'));
    expect(dialog.textContent).toContain('Сердце поселения');
    expect(dialog.textContent).toContain('Ур. 2/2');
    expect(dialog.textContent).toContain('Бревно: 5/20');
    const button = [...dialog.querySelectorAll('button')].find(b => b.textContent.includes('Начать улучшение'));
    expect(button.disabled).toBe(false);
    await act(async () => Simulate.click(button));
    expect(start).toHaveBeenCalledTimes(1);
});

test('shows missing experience and blocks upgrade before submitting', async () => {
    const start = await renderPreview(50);
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('50/100');
    expect(dialog.textContent).toContain('Не хватает 50 опыта здания');
    const button = [...dialog.querySelectorAll('button')].find(b => b.textContent.includes('Начать улучшение'));
    expect(button.disabled).toBe(true);
    expect(start).not.toHaveBeenCalled();
});

test('missing prerequisite building disables start even with enough experience', async () => {
    await renderPreview(150, 3);
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Ур. 2/3');
    expect([...dialog.querySelectorAll('button')].find(b => b.textContent.includes('Начать улучшение')).disabled).toBe(true);
});

test('experience utility preserves overflow and buildings without a threshold', () => {
    expect(getBuildingExperience({exp: 250}, {exp_for_levelup: 100}).current).toBe(250);
    expect(getBuildingExperience({exp: 20}, {})).toEqual({current: 20, required: 0, enough: true, missing: 0});
    expect(getBuildingExperience({}, {})).toBeNull();
});
