// ============================================
// FUTURE PLUS AUTHENTICATION
// ============================================


// ================= REGISTER =================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "registerName"
                ).value.trim();


            const phone =
                document.getElementById(
                    "registerPhone"
                ).value.trim();


            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "registerPassword"
                ).value;


            const className =
                document.getElementById(
                    "registerClass"
                ).value;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            message.textContent =
                "Account बनाया जा रहा है...";


            try {

                const { data, error } =
                    await supabaseClient.auth.signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {

                                full_name: name,

                                phone: phone,

                                class_name: className

                            }

                        }

                    });


                if (error) {
                    throw error;
                }


                message.textContent =
                    "Registration successful! आपका account Admin approval के बाद activate होगा।";


                registerForm.reset();


            } catch (error) {

                console.error(error);

                message.textContent =
                    error.message;

            }

        }
    );

}


// ================= LOGIN =================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "loginPassword"
                ).value;


            const message =
                document.getElementById(
                    "loginMessage"
                );


            message.textContent =
                "Login हो रहा है...";


            try {

                const { data, error } =
                    await supabaseClient.auth.signInWithPassword({

                        email: email,

                        password: password

                    });


                if (error) {
                    throw error;
                }


                const user =
                    data.user;


                const { data: profile, error: profileError } =
                    await supabaseClient
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .single();


                if (profileError) {
                    throw profileError;
                }


                if (profile.status !== "approved") {

                    await supabaseClient.auth.signOut();

                    message.textContent =
                        "आपका account अभी Admin approval का इंतजार कर रहा है।";

                    return;
                }


                if (profile.role === "admin") {

                    window.location.href =
                        "admin/dashboard.html";

                    return;
                }


                if (profile.role === "teacher") {

                    window.location.href =
                        "student/dashboard.html";

                    return;
                }


                window.location.href =
                    "student/dashboard.html";


            } catch (error) {

                console.error(error);

                message.textContent =
                    "Login failed: " +
                    error.message;

            }

        }
    );

}


// ================= FORGOT PASSWORD =================

const forgotPassword =
    document.getElementById("forgotPassword");


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            const email =
                prompt(
                    "अपना registered email डालें:"
                );


            if (!email) {
                return;
            }


            try {

                const { error } =
                    await supabaseClient.auth
                        .resetPasswordForEmail(
                            email,
                            {
                                redirectTo:
                                    window.location.origin +
                                    "/login.html"
                            }
                        );


                if (error) {
                    throw error;
                }


                alert(
                    "Password reset link आपके email पर भेज दिया गया है।"
                );


            } catch (error) {

                alert(
                    "Error: " +
                    error.message
                );

            }

        }
    );

}