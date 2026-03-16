const PublicLayout = ({ children }) => {
    return (
        <div>
            <header style={{ padding: '1rem', backgroundColor: 'white', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#00A3FF', fontSize: '1.2rem' }}>OrthoData</div>
                <nav>
                    <a href="/login" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>Se connecter</a>
                </nav>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
};

export default PublicLayout;
