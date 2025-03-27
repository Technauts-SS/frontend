import { useState } from "react";
import "./ContactForm.css";

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Ваше повідомлення відправлено!");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section className="contact-section">
      <h2 className="contact-title">Зв'яжіться з нами</h2>
      <p className="contact-description">
        Якщо ви маєте якісь запитання чи побажання, напишіть нам про це
      </p>

      <form onSubmit={handleSubmit} className="contact-form">
        <label>
          Ім'я:
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <label>
          Email:
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </label>
        <label>
          Повідомлення:
          <textarea name="message" value={formData.message} onChange={handleChange} required />
        </label>
        <button type="submit">Відправити повідомлення</button>
      </form>
    </section>
  );
}

export default ContactForm;
