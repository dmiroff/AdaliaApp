import React from 'react';
import { Alert, ProgressBar } from 'react-bootstrap';

const BuildingExperience = ({ experience }) => {
    if (!experience) return null;
    return (
        <div className="mb-3" data-testid="building-experience">
            <h6>Опыт здания:</h6>
            <div>{experience.current}{experience.required > 0 && `/${experience.required}`}</div>
            {experience.required > 0 && (
                <ProgressBar now={Math.min(100, experience.current / experience.required * 100)}
                    variant={experience.enough ? 'success' : 'warning'} />
            )}
            {!experience.enough && (
                <Alert variant="warning" className="mt-2 mb-0">
                    Не хватает {experience.missing} опыта здания для улучшения.
                </Alert>
            )}
        </div>
    );
};

export default BuildingExperience;
