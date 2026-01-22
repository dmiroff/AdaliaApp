import { Alert, Button, Card } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";

const Auth = () => {
    const navigate = useNavigate();
    
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            padding: '20px',
            flexDirection: 'column',
            textAlign: 'center'
        }}>
            <Card style={{ 
                maxWidth: '600px', 
                width: '100%',
                background: 'linear-gradient(135deg, rgba(244, 228, 188, 0.95) 0%, rgba(230, 210, 169, 0.98) 100%)',
                border: '2px solid var(--color-accent-bronze)',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(139, 69, 19, 0.4)'
            }}>
                <Card.Body>
                    <h2 className="fantasy-text-gold mb-4">Добро пожаловать в игру!</h2>
                    
                    <Alert variant="info" className="mb-4">
                        <h5>Способы входа:</h5>
                    </Alert>
                    
                    <div className="row mb-4">
                        <div className="col-md-6 mb-3">
                            <Card className="h-100">
                                <Card.Body>
                                    <Card.Title>Вход по логину и паролю</Card.Title>
                                    <Card.Text>
                                        Используйте этот способ, если у вас есть учетная запись.
                                    </Card.Text>
                                    <Button 
                                        variant="primary" 
                                        className="w-100"
                                        onClick={() => navigate('/login')}
                                    >
                                        Войти с логином и паролем
                                    </Button>
                                </Card.Body>
                            </Card>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                            <Card className="h-100">
                                <Card.Body>
                                    <Card.Title>Вход по специальной ссылке</Card.Title>
                                    <Card.Text>
                                        Используйте этот способ, если у вас есть специальная ссылка для входа.
                                    </Card.Text>
                                    <Alert variant="warning" className="small">
                                        Если у вас есть ссылка, просто перейдите по ней полностью.
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                    
                    <div className="mt-3">
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => navigate('/terms')}
                        >
                            Условия использования
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Auth;