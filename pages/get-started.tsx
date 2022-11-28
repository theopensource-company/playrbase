import React from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import styles from '../styles/pages/GetStarted.module.scss';

export default function GetStarted() {
  return (
    <div className={styles.default}>   
            
        <h1>Get started</h1>
        
        <Input type="name" placeholder='Name of organisation'/> 
        
        <Input type="email" placeholder='E-mail adres'/>    

        <Button href='/'>
            confirm my email
        </Button>

    </div>
  )
}