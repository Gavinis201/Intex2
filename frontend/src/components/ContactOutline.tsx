import '../App.css'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ContactOutline(){
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the form data to your backend
        console.log('Form submitted:', formData);
        // Reset form after submission
        setFormData({
            fullName: '',
            email: '',
            message: ''
        });
        // Navigate to thank you page
        navigate('/thank-you');
    };

    return(
        <>
            <div className="background-color">
                <div className="blackOp">
                    <div className="privacy-start">
                        <section className="privacy-section">
                            <h2>Contact Us</h2>
                            <p>
                                If you have any questions about this privacy policy or our privacy practices, please contact us using the form below:
                            </p>
                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={5}
                                    />
                                </div>
                                <button type="submit" className="submit-button">Send Message</button>
                            </form>
                            <p className="contact-info">
                                Or reach us directly at:<br />
                                Email: privacy@cineniche.com<br />
                                Phone: (555) 123-4567<br />
                                Address: 123 Movie Lane, Hollywood, CA 90210
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ContactOutline;