const supabaseClient = require("../config/supabase.js");

const signUp = async (req, res) => {
  const { email, password, nombre } = req.body;

  if (!email || !password || !nombre) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    //Create a user in supabase
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Save the user in the database
    const uuid = data.user.id;
    const { error: insertError } = await supabaseClient
      .from("usuarios")
      .insert([{ uuid, nombre, created: new Date().toISOString() }]);

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    res
      .status(201)
      .json({ message: "Usuario registrado exitosamente", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email y contraseña son obligatorios" });
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    const { session } = data;
    console.log("This is my data: ", session);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Recuperar el nombre del usuario desde la tabla personalizada
    const { data: userData, error: userError } = await supabaseClient
      .from("usuarios")
      .select("nombre")
      .eq("uuid", data.user.id)
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      token: data.session.access_token, // Incluye el token de sesión
      user: { id: data.user.id, nombre: userData.nombre },
    });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const verify = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    // Intenta obtener el usuario con el token actual
    const { data: user, error } = await supabaseClient.auth.getUser(token);

    if (error) {
      if (error.status === 403 && error.code === "bad_jwt") {
        return res.status(401).json({ error: "Token inválido o expirado" });
      }
      throw error; // Otros errores
    }

    // Si el token es válido, obtiene información adicional del usuario
    const { data: userData, error: userError } = await supabaseClient
      .from("usuarios")
      .select("nombre")
      .eq("uuid", user.user.id)
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    res
      .status(200)
      .json({ user: { id: user.user.id, nombre: userData.nombre } });
  } catch (err) {
    console.error("Error en verify:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  signUp,
  login,
  verify,
};
