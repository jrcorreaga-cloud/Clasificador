describe('E2E: Registro, Inicio de Sesión y Búsqueda', () => {
  const timestamp = Date.now();
  const testUser = {
    nombre: `Usuario ${timestamp}`,
    correo: `test${timestamp}@repop.com`,
    password: 'Password123!',
    rol: 'buscador' 
  };

  it('Debe completar el flujo completo: Registrar, Loguear y Buscar', () => {
    // 1. REGISTRO
    cy.visit('/');
    cy.contains('Registrarme').click();
    
    cy.get('input[name="nombre"]').type(testUser.nombre);
    cy.get('input[name="correo"]').type(testUser.correo);
    cy.get('input[value="buscador"]').check(); 
    cy.get('input[name="contrasenia"]').type(testUser.password);
    cy.get('input[name="confirmPassword"]').type(testUser.password);
    
    cy.get('form.login-form--register').submit();
    
    // Esperar a que cambie la vista o muestre mensaje de éxito y vuelva a login
    cy.contains('Iniciar sesión', { timeout: 10000 }).should('be.visible');

    // 2. LOGIN
    cy.get('input[name="email"]').clear().type(testUser.correo);
    cy.get('input[name="password"]').clear().type(testUser.password);
    cy.get('form.login-form:not(.login-form--register)').submit();
    
    // Validar que entramos al Dashboard (buscamos un elemento de la interfaz de usuario logueado)
    cy.get('.user-menu__trigger', { timeout: 10000 }).should('be.visible');

    // 3. BÚSQUEDA
    // Llenar los filtros
    cy.get('#filtro-minPrecio').type('500');
    cy.get('#filtro-maxPrecio').type('1500');
    cy.get('#filtro-habitaciones').type('1');
    
    // Los filtros aplican automáticamente (live update), no hay botón de "Buscar".
    
    // Verificar que aparece al menos una tarjeta de resultado
    cy.get('.republica-card').should('exist'); 
  });
});
