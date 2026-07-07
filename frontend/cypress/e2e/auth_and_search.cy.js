describe('E2E: Registro, Inicio de Sesión y Búsqueda', () => {
  const timestamp = Date.now();
  const testUser = {
    nombre: `Usuario ${timestamp}`,
    correo: `test${timestamp}@repop.com`,
    password: 'Password123!',
    rol: 'estudiante' // "buscador" en el frontend real
  };

  it('1. Debe registrar a un nuevo usuario estudiante', () => {
    cy.visit('/');
    // Hacer click en el botón para cambiar al formulario de registro
    cy.contains('Registrarme').click();
    
    // Llenar el formulario de registro
    cy.get('input[name="nombre"]').type(testUser.nombre);
    cy.get('input[name="correo"]').type(testUser.correo);
    cy.get('input[value="buscador"]').check(); // Seleccionar radio button "Buscador"
    cy.get('input[name="contrasenia"]').type(testUser.password);
    cy.get('input[name="confirmPassword"]').type(testUser.password);
    
    cy.get('form.login-form--register').submit();
    
    // Validar que regrese a login (el backend inicia sesión o manda mensaje)
    cy.contains('Iniciar sesión', { timeout: 10000 }).should('be.visible');
  });

  it('2. Debe iniciar sesión con el usuario creado', () => {
    cy.visit('/');
    // Por defecto ya debería estar en modo login, pero nos aseguramos
    cy.get('input[name="email"]').type(testUser.correo);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('form.login-form:not(.login-form--register)').submit();
    
    // Validar que ya entró (por ejemplo buscando el botón de logout o algo de la UI)
    cy.contains('Cerrar sesión', { timeout: 10000 }).should('exist');
  });

  it('3. Debe poder buscar una república usando filtros', () => {
    cy.visit('/');
    // Simular el inicio de sesión para poder buscar (o si es público, simplemente buscar)
    
    // Simular el uso de los filtros
    cy.get('#filtro-minPrecio').type('500');
    cy.get('#filtro-maxPrecio').type('1500');
    cy.get('#filtro-habitaciones').type('1');
    // Si existe el select de género:
    cy.get('select').first().select('mixto');
    
    // Presionar botón de búsqueda (generalmente dentro de filter-bar)
    cy.contains('Buscar').click();
    
    // Verificar que los resultados cargan
    cy.get('.republica-card').should('exist'); 
  });
});
