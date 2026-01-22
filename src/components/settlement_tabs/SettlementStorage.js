import React from 'react';
import { observer } from "mobx-react-lite";
import { Card, Table, ProgressBar, Badge } from 'react-bootstrap';

const calculateStorageUsage = (storage) => {
    if (!storage || typeof storage !== 'object') {
        return { used: 0, capacity: 0, percentage: 0 };
    }
    
    // Предполагаем, что склад может иметь максимальную вместимость
    // Если в данных нет явного поля capacity, используем сумму всех ресурсов
    const used = Object.values(storage).reduce((sum, val) => sum + (val || 0), 0);
    const capacity = 10000; // Примерное значение, можно получить из данных
    const percentage = capacity > 0 ? (used / capacity) * 100 : 0;
    
    return { used, capacity, percentage };
};

const SettlementStorage = observer(({ storage, guildId }) => {
    const storageData = storage || {};
    const { used, capacity, percentage } = calculateStorageUsage(storageData);
    
    const resourceItems = Object.entries(storageData)
        .filter(([key, value]) => typeof value === 'number' && value > 0)
        .sort((a, b) => b[1] - a[1]);

    return (
        <div className="settlement-storage">
            <Card className="fantasy-card">
                <Card.Header className="fantasy-card-header fantasy-card-header-success">
                    <h5 className="fantasy-text-gold mb-0">
                        <i className="fas fa-warehouse me-2"></i>
                        Склад поселения
                    </h5>
                </Card.Header>
                <Card.Body>
                    {/* Общая информация о складе */}
                    <div className="storage-summary mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fantasy-text-dark mb-0">
                                <i className="fas fa-box me-2"></i>
                                Общее использование склада
                            </h6>
                            <Badge bg="info" className="p-2">
                                {used.toLocaleString()} / {capacity.toLocaleString()}
                            </Badge>
                        </div>
                        <ProgressBar 
                            now={percentage} 
                            variant={percentage > 80 ? "danger" : percentage > 60 ? "warning" : "success"}
                            style={{ height: "12px" }}
                            className="mb-2"
                        />
                        <div className="d-flex justify-content-between">
                            <small className="fantasy-text-muted">
                                Использовано: {percentage.toFixed(1)}%
                            </small>
                            <small className="fantasy-text-muted">
                                Свободно: {(capacity - used).toLocaleString()}
                            </small>
                        </div>
                    </div>

                    {/* Список ресурсов */}
                    {resourceItems.length > 0 ? (
                        <>
                            <h6 className="fantasy-text-dark mb-3">
                                <i className="fas fa-cubes me-2"></i>
                                Ресурсы на складе ({resourceItems.length})
                            </h6>
                            <div className="table-responsive">
                                <Table hover className="fantasy-table">
                                    <thead>
                                        <tr>
                                            <th>Ресурс</th>
                                            <th>Количество</th>
                                            <th>Процент</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resourceItems.map(([key, value]) => {
                                            const resourcePercentage = (value / used) * 100;
                                            return (
                                                <tr key={key}>
                                                    <td className="fantasy-text-dark">
                                                        {getResourceName(key)} ({key})
                                                    </td>
                                                    <td>
                                                        <Badge bg="secondary" className="p-2">
                                                            {value.toLocaleString()}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <ProgressBar 
                                                                now={resourcePercentage} 
                                                                variant="info"
                                                                style={{ width: "100px", height: "6px" }}
                                                                className="me-2"
                                                            />
                                                            <small className="fantasy-text-muted">
                                                                {resourcePercentage.toFixed(1)}%
                                                            </small>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                            <p className="fantasy-text-muted">Склад пуст</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
});

// Вспомогательная функция для получения имени ресурса
const getResourceName = (key) => {
    const resourceNames = {
        '112': 'Дерево',
        '114': 'Камень',
        '115': 'Руда',
        '116': 'Кристаллы',
        '117': 'Стекло',
        '118': 'Золото',
        '119': 'Серебро',
        '120': 'Медь',
        '121': 'Железо'
    };
    return resourceNames[key] || `Ресурс ${key}`;
};

export default SettlementStorage;